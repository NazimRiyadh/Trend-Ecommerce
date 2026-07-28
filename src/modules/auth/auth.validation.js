import Joi from 'joi';

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const refresh = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export default {
  login,
  refresh,
};
