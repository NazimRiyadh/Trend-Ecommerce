import Joi from 'joi';

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    roleId: Joi.string().required(),
    phone: Joi.string().allow('', null),
    gender: Joi.string().valid('male', 'female', 'other').allow('', null),
    isActive: Joi.boolean().default(true),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(8),
    roleId: Joi.string(),
    phone: Joi.string().allow('', null),
    gender: Joi.string().valid('male', 'female', 'other').allow('', null),
    isActive: Joi.boolean(),
  }).min(1),
};

const getUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const listUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
    roleId: Joi.string().allow('', null),
    isActive: Joi.string().valid('true', 'false').allow('', null),
  }),
};

export default {
  createUser,
  updateUser,
  getUser,
  deleteUser,
  listUsers,
};
