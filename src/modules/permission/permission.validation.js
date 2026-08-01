  import Joi from 'joi';

  const createPermissionGroup = {
    body: Joi.object().keys({
      name: Joi.string().required().trim().invalid(' ').custom((value, helpers) => {
        if (/\s/.test(value)) {
          return helpers.message('Permission group name cannot contain spaces');
        }
        return value.toLowerCase();
      }),
      description: Joi.string().allow('', null),
      actions: Joi.array().items(
        Joi.string().trim().invalid(' ').custom((value, helpers) => {
          if (/\s/.test(value)) {
            return helpers.message('Action name cannot contain spaces');
          }
          return value.toLowerCase();
        })
      ).min(1).required(),
    }),
  };

  const updatePermissionGroup = {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      name: Joi.string().trim().invalid(' ').custom((value, helpers) => {
        if (/\s/.test(value)) {
          return helpers.message('Permission group name cannot contain spaces');
        }
        return value.toLowerCase();
      }),
      description: Joi.string().allow('', null),
      actions: Joi.array().items(
        Joi.string().trim().invalid(' ').custom((value, helpers) => {
          if (/\s/.test(value)) {
            return helpers.message('Action name cannot contain spaces');
          }
          return value.toLowerCase();
        })
      ).min(1),
    }).min(1),
  };

  const getPermissionGroup = {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  };

  const deletePermissionGroup = {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  };

  export default {
    createPermissionGroup,
    updatePermissionGroup,
    getPermissionGroup,
    deletePermissionGroup,
  };
