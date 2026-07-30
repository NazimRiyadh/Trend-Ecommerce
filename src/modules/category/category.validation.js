import Joi from 'joi';

const createCategory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    imageId: Joi.string().allow('', null),
    parentId: Joi.string().allow('', null),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0),
  }),
};

const updateCategory = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string().allow('', null),
    imageId: Joi.string().allow('', null),
    parentId: Joi.string().allow('', null),
    isActive: Joi.boolean(),
    sortOrder: Joi.number().integer(),
  }).min(1),
};

const getCategory = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteCategory = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export default {
  createCategory,
  updateCategory,
  getCategory,
  deleteCategory,
};
