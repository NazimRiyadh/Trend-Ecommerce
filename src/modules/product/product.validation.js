import Joi from 'joi';

const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    sku: Joi.string().required(),
    shortDescription: Joi.string().allow('', null),
    longDescription: Joi.string().allow('', null),
    hasVariants: Joi.boolean().default(false),
    price: Joi.number().min(0).when('hasVariants', {
      is: false,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    salePrice: Joi.number().min(0).less(Joi.ref('price')).allow(null).when('hasVariants', {
      is: true,
      then: Joi.forbidden(),
    }),
    stock: Joi.number().integer().min(0).when('hasVariants', {
      is: false,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    weight: Joi.number().min(0).allow(null),
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    sortOrder: Joi.number().integer().default(0),
    brandId: Joi.string().allow('', null),
    categoryIds: Joi.array().items(Joi.string()).default([]),
    media: Joi.array().items(
      Joi.object().keys({
        mediaId: Joi.string().required(),
        isThumbnail: Joi.boolean().default(false),
        isGallery: Joi.boolean().default(false),
        sortOrder: Joi.number().integer().default(0),
      })
    ).default([]),
    variants: Joi.array().items(
      Joi.object().keys({
        sku: Joi.string().required(),
        price: Joi.number().min(0).required(),
        salePrice: Joi.number().min(0).less(Joi.ref('price')).allow(null),
        stock: Joi.number().integer().min(0).required(),
        lowStockThreshold: Joi.number().integer().min(0).default(5),
        weight: Joi.number().min(0).allow(null),
        isActive: Joi.boolean().default(true),
        attributes: Joi.array().items(
          Joi.object().keys({
            attributeValueId: Joi.string().required(),
          })
        ).min(1).required(),
      })
    ).when('hasVariants', {
      is: true,
      then: Joi.array().min(1).required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    sku: Joi.string(),
    shortDescription: Joi.string().allow('', null),
    longDescription: Joi.string().allow('', null),
    price: Joi.number().min(0),
    salePrice: Joi.number().min(0).less(Joi.ref('price')).allow(null),
    stock: Joi.number().integer().min(0),
    weight: Joi.number().min(0).allow(null),
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    sortOrder: Joi.number().integer(),
    brandId: Joi.string().allow('', null),
    categoryIds: Joi.array().items(Joi.string()),
  }).min(1),
};

const getProduct = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteProduct = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const addVariants = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.array().items(
    Joi.object().keys({
      sku: Joi.string().required(),
      price: Joi.number().min(0).required(),
      salePrice: Joi.number().min(0).less(Joi.ref('price')).allow(null),
      stock: Joi.number().integer().min(0).required(),
      lowStockThreshold: Joi.number().integer().min(0).default(5),
      weight: Joi.number().min(0).allow(null),
      isActive: Joi.boolean().default(true),
      attributes: Joi.array().items(
        Joi.object().keys({
          attributeValueId: Joi.string().required(),
        })
      ).min(1).required(),
    })
  ).min(1).required(),
};

const updateVariant = {
  params: Joi.object().keys({
    id: Joi.string().required(),
    variantId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    sku: Joi.string(),
    price: Joi.number().min(0),
    salePrice: Joi.number().min(0).less(Joi.ref('price')).allow(null),
    stock: Joi.number().integer().min(0),
    lowStockThreshold: Joi.number().integer().min(0),
    weight: Joi.number().min(0).allow(null),
    isActive: Joi.boolean(),
  }).min(1),
};

const deleteVariant = {
  params: Joi.object().keys({
    id: Joi.string().required(),
    variantId: Joi.string().required(),
  }),
};

const addMedia = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    mediaId: Joi.string().required(),
    variantId: Joi.string().allow('', null),
    attributeValueId: Joi.string().allow('', null),
    isThumbnail: Joi.boolean().default(false),
    isGallery: Joi.boolean().default(false),
    sortOrder: Joi.number().integer().default(0),
  }),
};

const updateMediaAttachment = {
  params: Joi.object().keys({
    id: Joi.string().required(),
    mediaId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    isThumbnail: Joi.boolean(),
    isGallery: Joi.boolean(),
    sortOrder: Joi.number().integer(),
  }).min(1),
};

const deleteMediaAttachment = {
  params: Joi.object().keys({
    id: Joi.string().required(),
    mediaId: Joi.string().required(),
  }),
};

export default {
  createProduct,
  updateProduct,
  getProduct,
  deleteProduct,
  addVariants,
  updateVariant,
  deleteVariant,
  addMedia,
  updateMediaAttachment,
  deleteMediaAttachment,
};
