import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { StatusCodes } from 'http-status-codes';
import { Readable } from 'stream';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/prisma.js';
import cloudinary from '../../config/cloudinary.js';
import config from '../../config/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

const generatePublicId = (originalName) => {
  const randomStr = crypto.randomBytes(8).toString('hex');
  const cleanName = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9]/g, '_');
  return `${Date.now()}-${randomStr}-${cleanName}`;
};

/**
 * Upload a Buffer to Cloudinary, returning the secure_url and public_id.
 */
const uploadBufferToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
};

const processAndStoreFile = async (file, userId) => {
  // 1. Magic byte sniffing
  const typeInfo = await fileTypeFromBuffer(file.buffer);

  if (!typeInfo) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Could not determine file type for ${file.originalname}`);
  }

  if (!config.upload.allowedMimeTypes.includes(typeInfo.mime)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `File type ${typeInfo.mime} not allowed. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`
    );
  }

  const isImage = typeInfo.mime.startsWith('image/');
  const isVideo = typeInfo.mime.startsWith('video/');

  if (!isImage && !isVideo) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only images and videos are supported');
  }

  const publicId = generatePublicId(file.originalname);
  const folder = config.cloudinary.folder;
  const resourceType = isVideo ? 'video' : 'image';

  // 2. Upload original file to Cloudinary
  const uploadResult = await uploadBufferToCloudinary(file.buffer, {
    folder,
    public_id: publicId,
    resource_type: resourceType,
    // Preserve original quality for main asset
    quality: 'auto',
  });

  let width = uploadResult.width || null;
  let height = uploadResult.height || null;
  let thumbnailUrl = null;
  let cloudinaryThumbId = null;

  // 3. For images: generate 200x200 thumbnail in memory and upload separately
  if (isImage) {
    const thumbBuffer = await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .toFormat('webp')
      .toBuffer();

    const thumbPublicId = `thumb-${publicId}`;
    const thumbResult = await uploadBufferToCloudinary(thumbBuffer, {
      folder: `${folder}/thumbs`,
      public_id: thumbPublicId,
      resource_type: 'image',
      format: 'webp',
    });

    thumbnailUrl = thumbResult.secure_url;
    cloudinaryThumbId = thumbResult.public_id;
  }

  // 4. Create DB record
  const mediaRecord = await prisma.media.create({
    data: {
      fileName: file.originalname,
      storedPath: uploadResult.public_id, // Cloudinary public_id used as storedPath for compatibility
      publicUrl: uploadResult.secure_url,
      mimeType: typeInfo.mime,
      type: isImage ? 'image' : 'video',
      size: file.size,
      width,
      height,
      thumbnailUrl,
      cloudinaryId: uploadResult.public_id,
      cloudinaryThumbId,
      uploadedById: userId,
    },
  });

  return mediaRecord;
};

const uploadFiles = async (files, userId) => {
  if (!files || files.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No files provided');
  }

  const uploadPromises = files.map((file) => processAndStoreFile(file, userId));
  const results = await Promise.allSettled(uploadPromises);

  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push({
        fileName: files[index].originalname,
        error: result.reason.message,
      });
    }
  });

  if (successful.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'All uploads failed', failed);
  }

  return {
    successful,
    failed: failed.length > 0 ? failed : undefined,
  };
};

const queryMedia = async (filter, options) => {
  const { page, limit, skip } = getPagination(options.page, options.limit);
  const { search, type } = filter;

  const where = {
    ...(type && { type }),
    ...(search && {
      OR: [
        { fileName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      skip,
      take: limit,
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.media.count({ where }),
  ]);

  return getPagingData(total, page, limit, media);
};

const getMediaById = async (id) => {
  const media = await prisma.media.findUnique({
    where: { id },
    include: { uploadedBy: { select: { name: true } } },
  });

  if (!media) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Media not found');
  }

  return media;
};

const updateMedia = async (id, updateBody) => {
  const media = await getMediaById(id);

  return prisma.media.update({
    where: { id: media.id },
    data: updateBody,
  });
};

const deleteMedia = async (id) => {
  const media = await getMediaById(id);

  // Check if attached to any product (prevent dangling references)
  const attachments = await prisma.productMedia.count({
    where: { mediaId: id },
  });

  if (attachments > 0) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `Cannot delete media. It is currently attached to ${attachments} product(s).`
    );
  }

  // Delete DB record first
  await prisma.media.delete({ where: { id } });

  // Then remove from Cloudinary (best-effort, don't fail if already gone)
  try {
    if (media.cloudinaryId) {
      const resourceType = media.type === 'video' ? 'video' : 'image';
      await cloudinary.uploader.destroy(media.cloudinaryId, { resource_type: resourceType });
    }
    if (media.cloudinaryThumbId) {
      await cloudinary.uploader.destroy(media.cloudinaryThumbId, { resource_type: 'image' });
    }
  } catch (error) {
    console.error(`Failed to delete asset from Cloudinary: ${error.message}`);
  }
};

export default {
  uploadFiles,
  queryMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
};
