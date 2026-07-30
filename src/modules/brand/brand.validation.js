import Joi from 'joi';

const createBrand = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    logoId: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),
};

const updateBrand = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string().allow('', null),
    logoId: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1),
};

const getBrand = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteBrand = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export default {
  createBrand,
  updateBrand,
  getBrand,
  deleteBrand,
};
