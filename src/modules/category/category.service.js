import { StatusCodes } from 'http-status-codes';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/prisma.js';
import slugify from '../../utils/slugify.js';

const generateUniqueSlug = async (name) => {
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

const createCategory = async (data) => {
  const { name, parentId, imageId } = data;

  const slug = await generateUniqueSlug(name);

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Parent category not found');
    }
  }

  if (imageId) {
    const media = await prisma.media.findUnique({ where: { id: imageId } });
    if (!media) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Image not found in media library');
    }
  }

  return prisma.category.create({
    data: {
      ...data,
      slug,
    },
  });
};

const buildTree = (categories, parentId = null) => {
  const result = [];
  for (const category of categories) {
    if (category.parentId === parentId) {
      const children = buildTree(categories, category.id);
      if (children.length > 0) {
        category.children = children;
      }
      result.push(category);
    }
  }
  return result;
};

const getCategoryTree = async (isActive) => {
  const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};
  
  const categories = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  return buildTree(categories);
};

const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      parent: true,
    }
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  return category;
};

const updateCategory = async (id, updateBody) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  if (updateBody.name && updateBody.name !== category.name) {
    updateBody.slug = await generateUniqueSlug(updateBody.name);
  }

  if (updateBody.parentId) {
    if (updateBody.parentId === id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'A category cannot be its own parent');
    }
    const parent = await prisma.category.findUnique({ where: { id: updateBody.parentId } });
    if (!parent) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Parent category not found');
    }
    
    // Cycle detection check (simple check for direct parent being a child)
    let currentParentId = parent.parentId;
    while(currentParentId) {
      if (currentParentId === id) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot set a descendant as parent (cycle detected)');
      }
      const ancestor = await prisma.category.findUnique({ where: { id: currentParentId } });
      currentParentId = ancestor?.parentId || null;
    }
  }

  if (updateBody.imageId) {
    const media = await prisma.media.findUnique({ where: { id: updateBody.imageId } });
    if (!media) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Image not found in media library');
    }
  }

  return prisma.category.update({
    where: { id },
    data: updateBody,
  });
};

const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { children: true, products: true }
      }
    }
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  if (category._count.children > 0) {
    throw new ApiError(StatusCodes.CONFLICT, 'Cannot delete category because it has child categories');
  }

  if (category._count.products > 0) {
    throw new ApiError(StatusCodes.CONFLICT, 'Cannot delete category because it contains products');
  }

  await prisma.category.delete({
    where: { id },
  });
};

export default {
  createCategory,
  getCategoryTree,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
