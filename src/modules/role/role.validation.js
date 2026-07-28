import Joi from 'joi';

const createRole = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive').default('active'),
    permissionIds: Joi.array().items(Joi.string()).min(1),
    grantAll: Joi.boolean().default(false),
  }).or('permissionIds', 'grantAll'), // Must provide at least one
};

const updateRole = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().trim(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive'),
    permissionIds: Joi.array().items(Joi.string()).min(1),
    grantAll: Joi.boolean(),
  }).min(1),
};

const getRole = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteRole = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export default {
  createRole,
  updateRole,
  getRole,
  deleteRole,
};
