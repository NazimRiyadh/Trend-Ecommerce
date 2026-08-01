import { StatusCodes } from 'http-status-codes';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/prisma.js';
import slugify from '../../utils/slugify.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

const generateUniqueSlug = async (name) => {
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

const deriveStockStatus = (stock, lowStockThreshold = 5) => {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
};

const validateVariantAttributes = (variants) => {
  const combinationSet = new Set();
  
  for (const variant of variants) {
    // Sort attribute value IDs to ensure consistent combination string
    const sortedAttrIds = variant.attributes
      .map(a => a.attributeValueId)
      .sort()
      .join('-');
      
    if (combinationSet.has(sortedAttrIds)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Two variants cannot have the identical attribute combination');
    }
    combinationSet.add(sortedAttrIds);
  }
};

const getVariantCombinationKey = (attributeValueIds) =>
  [...attributeValueIds].sort().join('-');

const validateVariantCombinationsAgainstExisting = (existingVariants, newVariants) => {
  const combinationSet = new Set(
    existingVariants.map((v) =>
      getVariantCombinationKey(v.attributeValues.map((av) => av.attributeValueId)),
    ),
  );

  for (const variant of newVariants) {
    const key = getVariantCombinationKey(variant.attributes.map((a) => a.attributeValueId));
    if (combinationSet.has(key)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Two variants cannot have the identical attribute combination');
    }
    combinationSet.add(key);
  }
};

const checkSkusUniqueness = async (tx, productSku, variantSkus) => {
  const allSkus = [productSku, ...variantSkus].filter(Boolean);
  
  // Check for duplicate SKUs within the request itself
  if (new Set(allSkus).size !== allSkus.length) {
    throw new ApiError(StatusCodes.CONFLICT, 'Duplicate SKUs found in the request');
  }

  // Check DB for existing Product SKUs
  for (const sku of allSkus) {
    const existingProduct = await tx.product.findUnique({ where: { sku } });
    if (existingProduct) {
      throw new ApiError(StatusCodes.CONFLICT, `SKU '${sku}' is already in use by a product`);
    }

    const existingVariant = await tx.productVariant.findUnique({ where: { sku } });
    if (existingVariant) {
      throw new ApiError(StatusCodes.CONFLICT, `SKU '${sku}' is already in use by a variant`);
    }
  }
};

const createProduct = async (data) => {
  const {
    name, sku, hasVariants, price, salePrice, stock, 
    categoryIds = [], brandId, media = [], variants = [],
    ...rest
  } = data;

  const slug = await generateUniqueSlug(name);

  // Validate Simple vs Variable constraints
  if (hasVariants && variants.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Variable product must have at least one variant');
  }

  if (hasVariants) {
    validateVariantAttributes(variants);
  }

  let stockStatus = null;
  if (!hasVariants) {
    stockStatus = deriveStockStatus(stock);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Verify SKU uniqueness
    const variantSkus = hasVariants ? variants.map(v => v.sku) : [];
    await checkSkusUniqueness(tx, sku, variantSkus);

    // 2. Verify dependencies (Brand, Categories, Media, Attributes)
    if (brandId) {
      const brand = await tx.brand.findUnique({ where: { id: brandId } });
      if (!brand) throw new ApiError(StatusCodes.NOT_FOUND, 'Brand not found');
    }

    if (categoryIds.length > 0) {
      const categories = await tx.category.findMany({ where: { id: { in: categoryIds } } });
      if (categories.length !== categoryIds.length) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'One or more categories not found');
      }
    }

    if (hasVariants) {
      for (const variant of variants) {
        for (const attr of variant.attributes) {
          const attributeValue = await tx.attributeValue.findUnique({ where: { id: attr.attributeValueId } });
          if (!attributeValue) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Attribute value '${attr.attributeValueId}' not found`);
          }
        }
      }
    }

    // Process media to ensure only ONE thumbnail is set
    const processedMedia = [...media];
    let foundThumbnail = false;
    for (let i = 0; i < processedMedia.length; i++) {
      if (processedMedia[i].isThumbnail) {
        if (foundThumbnail) {
          processedMedia[i].isThumbnail = false; // Demote
        } else {
          foundThumbnail = true;
        }
      }
    }

    for (const m of processedMedia) {
      const existingMedia = await tx.media.findUnique({ where: { id: m.mediaId } });
      if (!existingMedia) throw new ApiError(StatusCodes.NOT_FOUND, `Media '${m.mediaId}' not found`);
    }

    // 3. Create Product
    const productData = {
      name,
      slug,
      sku,
      hasVariants,
      price: hasVariants ? null : price,
      salePrice: hasVariants ? null : salePrice,
      stock: hasVariants ? null : stock,
      stockStatus: hasVariants ? null : stockStatus,
      brandId,
      ...rest
    };

    const product = await tx.product.create({
      data: productData,
    });

    // 4. Link Categories
    if (categoryIds.length > 0) {
      await tx.productCategory.createMany({
        data: categoryIds.map(categoryId => ({ productId: product.id, categoryId })),
      });
    }

    // 5. Attach Media
    if (processedMedia.length > 0) {
      await tx.productMedia.createMany({
        data: processedMedia.map(m => ({
          productId: product.id,
          mediaId: m.mediaId,
          isThumbnail: m.isThumbnail,
          isGallery: m.isGallery,
          sortOrder: m.sortOrder,
        })),
      });
    }

    // 6. Create Variants & Link Attribute Values
    if (hasVariants) {
      for (const variant of variants) {
        const vStockStatus = deriveStockStatus(variant.stock, variant.lowStockThreshold);
        
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: variant.sku,
            price: variant.price,
            salePrice: variant.salePrice,
            stock: variant.stock,
            stockStatus: vStockStatus,
            lowStockThreshold: variant.lowStockThreshold,
            weight: variant.weight,
            isActive: variant.isActive,
          }
        });

        // Link Attribute values
        await tx.variantAttributeValue.createMany({
          data: variant.attributes.map(attr => ({
            variantId: createdVariant.id,
            attributeValueId: attr.attributeValueId,
          })),
        });

        // We also need to populate ProductAttribute to know which attributes this product has globally
        for (const attr of variant.attributes) {
          const attributeValue = await tx.attributeValue.findUnique({ where: { id: attr.attributeValueId } });
          // Link product to attribute (ignore if already linked)
          const existingPA = await tx.productAttribute.findUnique({
            where: {
              productId_attributeId: {
                productId: product.id,
                attributeId: attributeValue.attributeId,
              }
            }
          });
          
          if (!existingPA) {
            await tx.productAttribute.create({
              data: {
                productId: product.id,
                attributeId: attributeValue.attributeId,
              }
            });
          }
        }
      }
    }

    return getProductByIdTransaction(tx, product.id);
  });
};

const queryProducts = async (filter, options) => {
  const { page, limit, skip } = getPagination(options.page, options.limit);
  const { search, categoryId, brandId, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = filter;

  // Whitelist allowed sort columns
  const allowedSortBy = ['createdAt', 'name', 'price', 'updatedAt'];
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  const where = {
    ...(isActive !== undefined && { isActive: isActive === 'true' }),
    ...(brandId && { brandId }),
    ...(categoryId && { categories: { some: { categoryId } } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        brand: { select: { id: true, name: true } },
        categories: { include: { category: { select: { id: true, name: true } } } },
        media: { 
          where: { isThumbnail: true }, 
          include: { media: { select: { publicUrl: true } } } 
        },
        variants: {
          select: { price: true, salePrice: true }
        }
      },
      orderBy: { [safeSortBy]: safeSortOrder },
    }),
    prisma.product.count({ where }),
  ]);

  // Format the response for list view
  const formattedProducts = products.map(p => {
    const categories = p.categories.map(c => ({ id: c.category.id, name: c.category.name }));
    const thumbnail = p.media.length > 0 ? p.media[0].media.publicUrl : null;
    
    let displayPrice = p.price;
    let minPrice = null;
    let maxPrice = null;

    if (p.hasVariants && p.variants.length > 0) {
      const prices = p.variants.map(v => Number(v.salePrice || v.price));
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
      displayPrice = minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`;
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      hasVariants: p.hasVariants,
      isActive: p.isActive,
      displayPrice,
      stock: p.stock,
      stockStatus: p.stockStatus,
      brand: p.brand,
      categories,
      thumbnail,
    };
  });

  return getPagingData(total, options.page, options.limit, formattedProducts);
};

const getProductByIdTransaction = async (tx, id) => {
  const product = await tx.product.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      media: { include: { media: { select: { id: true, publicUrl: true } } } },
      variants: {
        include: {
          attributeValues: {
            include: {
              attributeValue: {
                include: {
                  attribute: { select: { id: true, name: true } }
                }
              }
            }
          },
          media: { include: { media: { select: { id: true, publicUrl: true } } } }
        }
      }
    }
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Flatten relations for response
  return {
    ...product,
    categories: product.categories.map(c => ({ id: c.category.id, name: c.category.name })),
    media: product.media.map(m => ({
      id: m.id,
      mediaId: m.mediaId,
      url: m.media.publicUrl,
      isThumbnail: m.isThumbnail,
      isGallery: m.isGallery,
      sortOrder: m.sortOrder,
    })),
    variants: product.variants.map(v => ({
      ...v,
      attributeValues: v.attributeValues.map(av => ({
        attributeId: av.attributeValue.attribute.id,
        attributeName: av.attributeValue.attribute.name,
        valueId: av.attributeValue.id,
        value: av.attributeValue.value,
      })),
      media: v.media.map(m => ({
        id: m.id,
        mediaId: m.mediaId,
        url: m.media.publicUrl,
      }))
    }))
  };
};

const getProductById = async (id) => {
  return prisma.$transaction(async (tx) => {
    return getProductByIdTransaction(tx, id);
  });
};

const updateProduct = async (id, updateBody) => {
  // Update logic (simplified for product basic details)
  const { name, sku, categoryIds, ...rest } = updateBody;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

    let slug = product.slug;
    if (name && name !== product.name) {
      slug = await generateUniqueSlug(name);
    }

    if (sku && sku !== product.sku) {
      await checkSkusUniqueness(tx, sku, []);
    }

    // Update categories
    if (categoryIds !== undefined) {
      await tx.productCategory.deleteMany({ where: { productId: id } });
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map(categoryId => ({ productId: id, categoryId })),
        });
      }
    }

    let stockStatus = product.stockStatus;
    if (rest.stock !== undefined && !product.hasVariants) {
      stockStatus = deriveStockStatus(rest.stock);
    }

    await tx.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : product.name,
        slug,
        sku: sku !== undefined ? sku : product.sku,
        stockStatus,
        ...rest,
      },
    });

    return getProductByIdTransaction(tx, id);
  });
};

const deleteProduct = async (id) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Schema handles cascades for ProductMedia, ProductVariant, etc.
  await prisma.product.delete({
    where: { id },
  });
};

const addVariants = async (id, variants) => {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ 
      where: { id },
      include: { variants: { include: { attributeValues: true } } }
    });
    
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    if (!product.hasVariants) throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot add variants to a simple product');

    const variantSkus = variants.map(v => v.sku);
    await checkSkusUniqueness(tx, null, variantSkus);

    validateVariantAttributes(variants);
    validateVariantCombinationsAgainstExisting(product.variants, variants);

    for (const variant of variants) {
      for (const attr of variant.attributes) {
        const attributeValue = await tx.attributeValue.findUnique({ where: { id: attr.attributeValueId } });
        if (!attributeValue) {
          throw new ApiError(StatusCodes.BAD_REQUEST, `Attribute value '${attr.attributeValueId}' not found`);
        }
      }
    }

    for (const variant of variants) {
      const vStockStatus = deriveStockStatus(variant.stock, variant.lowStockThreshold);
      
      const createdVariant = await tx.productVariant.create({
        data: {
          productId: id,
          sku: variant.sku,
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          stockStatus: vStockStatus,
          lowStockThreshold: variant.lowStockThreshold,
          weight: variant.weight,
          isActive: variant.isActive,
        }
      });

      await tx.variantAttributeValue.createMany({
        data: variant.attributes.map(attr => ({
          variantId: createdVariant.id,
          attributeValueId: attr.attributeValueId,
        })),
      });
      
      for (const attr of variant.attributes) {
        const attributeValue = await tx.attributeValue.findUnique({ where: { id: attr.attributeValueId } });
        const existingPA = await tx.productAttribute.findUnique({
          where: { productId_attributeId: { productId: id, attributeId: attributeValue.attributeId } }
        });
        
        if (!existingPA) {
          await tx.productAttribute.create({
            data: { productId: id, attributeId: attributeValue.attributeId }
          });
        }
      }
    }

    return getProductByIdTransaction(tx, id);
  });
};

const updateVariant = async (id, variantId, updateBody) => {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({ where: { id: variantId, productId: id } });
    if (!variant) throw new ApiError(StatusCodes.NOT_FOUND, 'Variant not found');

    if (updateBody.sku && updateBody.sku !== variant.sku) {
      await checkSkusUniqueness(tx, null, [updateBody.sku]);
    }

    let stockStatus = variant.stockStatus;
    if (updateBody.stock !== undefined || updateBody.lowStockThreshold !== undefined) {
      const stock = updateBody.stock !== undefined ? updateBody.stock : variant.stock;
      const threshold = updateBody.lowStockThreshold !== undefined ? updateBody.lowStockThreshold : variant.lowStockThreshold;
      stockStatus = deriveStockStatus(stock, threshold);
    }

    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        ...updateBody,
        stockStatus,
      },
    });

    return getProductByIdTransaction(tx, id);
  });
};

const deleteVariant = async (id, variantId) => {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId, productId: id } });
  if (!variant) throw new ApiError(StatusCodes.NOT_FOUND, 'Variant not found');

  await prisma.productVariant.delete({ where: { id: variantId } });
};

const addMedia = async (id, mediaBody) => {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

    if (mediaBody.isThumbnail) {
      // Demote previous thumbnail
      await tx.productMedia.updateMany({
        where: { productId: id, isThumbnail: true, variantId: mediaBody.variantId || null },
        data: { isThumbnail: false }
      });
    }

    await tx.productMedia.create({
      data: {
        productId: id,
        mediaId: mediaBody.mediaId,
        variantId: mediaBody.variantId,
        attributeValueId: mediaBody.attributeValueId,
        isThumbnail: mediaBody.isThumbnail,
        isGallery: mediaBody.isGallery,
        sortOrder: mediaBody.sortOrder,
      }
    });

    return getProductByIdTransaction(tx, id);
  });
};

const updateMediaAttachment = async (id, mediaId, updateBody) => {
  return prisma.$transaction(async (tx) => {
    const pm = await tx.productMedia.findUnique({ where: { id: mediaId, productId: id } });
    if (!pm) throw new ApiError(StatusCodes.NOT_FOUND, 'Media attachment not found');

    if (updateBody.isThumbnail) {
      await tx.productMedia.updateMany({
        where: { productId: id, isThumbnail: true, variantId: pm.variantId },
        data: { isThumbnail: false }
      });
    }

    await tx.productMedia.update({
      where: { id: mediaId },
      data: updateBody,
    });

    return getProductByIdTransaction(tx, id);
  });
};

const deleteMediaAttachment = async (id, mediaId) => {
  const pm = await prisma.productMedia.findUnique({ where: { id: mediaId, productId: id } });
  if (!pm) throw new ApiError(StatusCodes.NOT_FOUND, 'Media attachment not found');

  await prisma.productMedia.delete({ where: { id: mediaId } });
};

export default {
  createProduct,
  queryProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariants,
  updateVariant,
  deleteVariant,
  addMedia,
  updateMediaAttachment,
  deleteMediaAttachment,
};
