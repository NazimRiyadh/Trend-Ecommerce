import { StatusCodes } from 'http-status-codes';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/prisma.js';
import slugify from '../../utils/slugify.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

const generateUniqueSlug = async (name) => {
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.brand.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

const createBrand = async (data) => {
  const { name, logoId } = data;

  if (await prisma.brand.findUnique({ where: { name } })) {
    throw new ApiError(StatusCodes.CONFLICT, 'Brand name already exists');
  }

  if (logoId) {
    const media = await prisma.media.findUnique({ where: { id: logoId } });
    if (!media) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Logo image not found in media library');
    }
  }

  const slug = await generateUniqueSlug(name);

  return prisma.brand.create({
    data: {
      ...data,
      slug,
    },
  });
};

const queryBrands = async (filter, options) => {
  const { page, limit, skip } = getPagination(options.page, options.limit);
  const { search, status } = filter;

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.brand.count({ where }),
  ]);

  return getPagingData(total, page, limit, brands);
};

const getBrandById = async (id) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
  });

  if (!brand) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Brand not found');
  }

  return brand;
};

const updateBrand = async (id, updateBody) => {
  const brand = await getBrandById(id);

  if (updateBody.name && updateBody.name !== brand.name) {
    if (await prisma.brand.findUnique({ where: { name: updateBody.name } })) {
      throw new ApiError(StatusCodes.CONFLICT, 'Brand name already exists');
    }
    updateBody.slug = await generateUniqueSlug(updateBody.name);
  }

  if (updateBody.logoId) {
    const media = await prisma.media.findUnique({ where: { id: updateBody.logoId } });
    if (!media) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Logo image not found in media library');
    }
  }

  return prisma.brand.update({
    where: { id },
    data: updateBody,
  });
};

const deleteBrand = async (id) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!brand) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Brand not found');
  }

  if (brand._count.products > 0) {
    throw new ApiError(StatusCodes.CONFLICT, 'Cannot delete brand because products are referencing it');
  }

  await prisma.brand.delete({
    where: { id },
  });
};

export default {
  createBrand,
  queryBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
