import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/prisma.js';
import config from '../../config/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

const generateUniqueFilename = (originalName, ext) => {
  const randomStr = crypto.randomBytes(8).toString('hex');
  const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${Date.now()}-${randomStr}-${cleanName}.${ext}`;
};

const processAndStoreFile = async (file, userId) => {
  // 1. Magic byte sniffing
  const typeInfo = await fileTypeFromBuffer(file.buffer);
  
  if (!typeInfo) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Could not determine file type for ${file.originalname}`);
  }

  if (!config.upload.allowedMimeTypes.includes(typeInfo.mime)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `File type ${typeInfo.mime} not allowed. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`);
  }

  const isImage = typeInfo.mime.startsWith('image/');
  const isVideo = typeInfo.mime.startsWith('video/');
  
  if (!isImage && !isVideo) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only images and videos are supported');
  }

  const ext = typeInfo.ext;
  const fileName = generateUniqueFilename(file.originalname, ext);
  const storedPath = path.join(config.upload.dir, fileName);
  const publicUrl = `/uploads/${fileName}`;

  let width = null;
  let height = null;
  let thumbnailUrl = null;

  // 2. Write main file to disk
  await fs.writeFile(storedPath, file.buffer);

  // 3. Process image specific data (dimensions, thumbnail)
  if (isImage) {
    const metadata = await sharp(file.buffer).metadata();
    width = metadata.width;
    height = metadata.height;

    // Generate 200x200 thumbnail
    const thumbName = `thumb-${fileName}`;
    const thumbPath = path.join(config.upload.dir, thumbName);
    
    await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .toFile(thumbPath);

    thumbnailUrl = `/uploads/${thumbName}`;
  }

  // 4. Create DB record
  const mediaRecord = await prisma.media.create({
    data: {
      fileName: file.originalname,
      storedPath,
      publicUrl,
      mimeType: typeInfo.mime,
      type: isImage ? 'image' : 'video',
      size: file.size,
      width,
      height,
      thumbnailUrl,
      uploadedById: userId,
    }
  });

  return mediaRecord;
};

const uploadFiles = async (files, userId) => {
  if (!files || files.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No files provided');
  }

  const uploadPromises = files.map(file => processAndStoreFile(file, userId));
  const results = await Promise.allSettled(uploadPromises);

  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push({
        fileName: files[index].originalname,
        error: result.reason.message
      });
    }
  });

  if (successful.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'All uploads failed', failed);
  }

  return {
    successful,
    failed: failed.length > 0 ? failed : undefined
  };
};

const queryMedia = async (filter, options) => {
  const { page, limit } = getPagination(options.page, options.limit);
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
      skip: page,
      take: limit,
      include: {
        uploadedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.media.count({ where })
  ]);

  return getPagingData(total, options.page, options.limit, media);
};

const getMediaById = async (id) => {
  const media = await prisma.media.findUnique({
    where: { id },
    include: { uploadedBy: { select: { name: true } } }
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
    data: updateBody
  });
};

const deleteMedia = async (id) => {
  const media = await getMediaById(id);

  // Check if attached to any product (prevent dangling references)
  const attachments = await prisma.productMedia.count({
    where: { mediaId: id }
  });

  if (attachments > 0) {
    throw new ApiError(
      StatusCodes.CONFLICT, 
      `Cannot delete media. It is currently attached to ${attachments} product(s).`
    );
  }

  // Delete from DB first
  await prisma.media.delete({ where: { id } });

  // Then delete files from disk
  try {
    await fs.unlink(media.storedPath);
    if (media.thumbnailUrl) {
      const thumbFileName = path.basename(media.thumbnailUrl);
      await fs.unlink(path.join(config.upload.dir, thumbFileName));
    }
  } catch (error) {
    // We log it but don't fail the request since DB record is gone
    console.error(`Failed to delete file from disk: ${error.message}`);
  }
};

export default {
  uploadFiles,
  queryMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
};
