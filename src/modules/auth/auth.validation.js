import Joi from 'joi';

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

// Refresh token now comes from an HttpOnly cookie, not the request body.
// The body validation is intentionally empty — validation of the cookie
// is handled in the controller (presence check) and service (JWT verify).
const refresh = {
  body: Joi.object().keys({}),
};

export default {
  login,
  refresh,
};
