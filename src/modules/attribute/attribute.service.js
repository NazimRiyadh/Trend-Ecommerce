import { StatusCodes } from 'http-status-codes';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/prisma.js';
import slugify from '../../utils/slugify.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

const generateUniqueSlug = async (name, modelName = 'attribute') => {
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma[modelName].findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

const createAttribute = async (data) => {
  const { name, type, values } = data;

  if (await prisma.attribute.findUnique({ where: { name } })) {
    throw new ApiError(StatusCodes.CONFLICT, 'Attribute name already exists');
  }

  const attributeSlug = await generateUniqueSlug(name, 'attribute');

  return prisma.$transaction(async (tx) => {
    const attribute = await tx.attribute.create({
      data: {
        name,
        slug: attributeSlug,
        type,
      },
    });

    const valuesData = values.map((v) => ({
      attributeId: attribute.id,
      value: v.value,
      slug: slugify(v.value), // We don't ensure global uniqueness, only per attribute
      referenceValue: v.referenceValue,
    }));

    // Check for duplicate value slugs within the same attribute
    const slugs = valuesData.map(v => v.slug);
    if (new Set(slugs).size !== slugs.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Duplicate attribute values provided');
    }

    await tx.attributeValue.createMany({
      data: valuesData,
    });

    return tx.attribute.findUnique({
      where: { id: attribute.id },
      include: { values: true },
    });
  });
};

const queryAttributes = async (filter, options) => {
  const { page, limit } = getPagination(options.page, options.limit);
  const { search, type } = filter;

  const where = {
    ...(type && { type }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [attributes, total] = await Promise.all([
    prisma.attribute.findMany({
      where,
      skip: page,
      take: limit,
      include: { values: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.attribute.count({ where }),
  ]);

  return getPagingData(total, options.page, options.limit, attributes);
};

const getAttributeById = async (id) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id },
    include: { values: true },
  });

  if (!attribute) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Attribute not found');
  }

  return attribute;
};

const updateAttribute = async (id, updateBody) => {
  const attribute = await getAttributeById(id);
  const { name, type, values } = updateBody;

  let newSlug = attribute.slug;
  if (name && name !== attribute.name) {
    if (await prisma.attribute.findUnique({ where: { name } })) {
      throw new ApiError(StatusCodes.CONFLICT, 'Attribute name already exists');
    }
    newSlug = await generateUniqueSlug(name, 'attribute');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Update the main attribute
    await tx.attribute.update({
      where: { id },
      data: {
        name: name !== undefined ? name : attribute.name,
        slug: newSlug,
        type: type !== undefined ? type : attribute.type,
      },
    });

    // 2. Sync values if provided
    if (values) {
      const incomingIds = values.filter(v => v.id).map(v => v.id);
      const existingIds = attribute.values.map(v => v.id);
      
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      
      // Before deleting, check if these values are used in variants
      if (toDelete.length > 0) {
        for (const valueId of toDelete) {
          const usedCount = await tx.variantAttributeValue.count({ where: { attributeValueId: valueId }});
          if (usedCount > 0) {
            const val = attribute.values.find(v => v.id === valueId);
            throw new ApiError(StatusCodes.CONFLICT, `Cannot remove value '${val.value}' as it is used by a product variant`);
          }
        }

        await tx.attributeValue.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Update existing or create new
      for (const val of values) {
        const valueSlug = slugify(val.value);
        
        if (val.id) {
          // Check if this new slug collides with another existing value in this attribute
          const clash = await tx.attributeValue.findFirst({
            where: { attributeId: id, slug: valueSlug, id: { not: val.id } }
          });
          if (clash) throw new ApiError(StatusCodes.BAD_REQUEST, `Duplicate value '${val.value}' within attribute`);
          
          await tx.attributeValue.update({
            where: { id: val.id },
            data: { value: val.value, slug: valueSlug, referenceValue: val.referenceValue },
          });
        } else {
          // Check collision
          const clash = await tx.attributeValue.findFirst({
            where: { attributeId: id, slug: valueSlug }
          });
          if (clash) throw new ApiError(StatusCodes.BAD_REQUEST, `Duplicate value '${val.value}' within attribute`);

          await tx.attributeValue.create({
            data: {
              attributeId: id,
              value: val.value,
              slug: valueSlug,
              referenceValue: val.referenceValue,
            }
          });
        }
      }
    }

    return tx.attribute.findUnique({
      where: { id },
      include: { values: true },
    });
  });
};

const deleteAttribute = async (id) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  if (!attribute) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Attribute not found');
  }

  if (attribute._count.products > 0) {
    throw new ApiError(StatusCodes.CONFLICT, 'Cannot delete attribute because it is used by products');
  }
  
  // Also check if any of its values are used in variantAttributeValue
  const valuesInUse = await prisma.variantAttributeValue.count({
    where: {
      attributeValue: {
        attributeId: id
      }
    }
  });

  if (valuesInUse > 0) {
    throw new ApiError(StatusCodes.CONFLICT, 'Cannot delete attribute because its values are used by product variants');
  }

  await prisma.attribute.delete({
    where: { id },
  });
};

export default {
  createAttribute,
  queryAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
};
