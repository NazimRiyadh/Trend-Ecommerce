import Joi from 'joi';

const updateMedia = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    altText: Joi.string().allow('', null),
    title: Joi.string().allow('', null),
  }).min(1),
};

const getMedia = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteMedia = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export default {
  updateMedia,
  getMedia,
  deleteMedia,
};
