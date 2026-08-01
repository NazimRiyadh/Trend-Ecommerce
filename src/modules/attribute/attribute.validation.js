import Joi from 'joi';

const createAttribute = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    type: Joi.string().valid('dropdown', 'radio', 'checkbox', 'colour_swatch', 'image_swatch').required(),
    values: Joi.array().items(
      Joi.object().keys({
        value: Joi.string().required(),
        referenceValue: Joi.string().allow('', null),
      })
    ).min(1).required(),
  }),
};

const updateAttribute = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    type: Joi.string().valid('dropdown', 'radio', 'checkbox', 'colour_swatch', 'image_swatch'),
    values: Joi.array().items(
      Joi.object().keys({
        id: Joi.string(), // If provided, update existing. If not, create new.
        value: Joi.string().required(),
        referenceValue: Joi.string().allow('', null),
      })
    ).min(1),
  }).min(1),
};

const getAttribute = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteAttribute = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const addAttributeValue = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    value: Joi.string().required(),
    referenceValue: Joi.string().allow('', null),
  }),
};

const updateAttributeValue = {
  params: Joi.object().keys({
    id: Joi.string().required(),
    valueId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    value: Joi.string(),
    referenceValue: Joi.string().allow('', null),
  }).min(1),
};

const deleteAttributeValue = {
  params: Joi.object().keys({
    id: Joi.string().required(),
    valueId: Joi.string().required(),
  }),
};

export default {
  createAttribute,
  updateAttribute,
  getAttribute,
  deleteAttribute,
  addAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
};
