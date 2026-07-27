const Joi = require('joi');
const ApiError = require('../utils/ApiError');
const { StatusCodes } = require('http-status-codes');

const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  
  if (schema.params) validSchema.params = schema.params;
  if (schema.query) validSchema.query = schema.query;
  if (schema.body) validSchema.body = schema.body;
  
  const object = Object.keys(validSchema).reduce((obj, key) => {
    if (Object.prototype.hasOwnProperty.call(req, key)) {
      obj[key] = req[key];
    }
    return obj;
  }, {});

  const joiSchema = Joi.object(validSchema);
  const { value, error } = joiSchema.validate(object, { abortEarly: false });

  if (error) {
    const errors = error.details.map((details) => ({
      field: details.context.key,
      message: details.message
    }));
    return next(new ApiError(StatusCodes.BAD_REQUEST, 'Validation Error', errors));
  }

  Object.assign(req, value);
  return next();
};

module.exports = validate;
