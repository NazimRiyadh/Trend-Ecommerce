import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import roleService from './role.service.js';

const createRole = catchAsync(async (req, res) => {
  const role = await roleService.createRole(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Role created successfully', role));
});

const getRoles = catchAsync(async (req, res) => {
  const filter = { search: req.query.search };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await roleService.queryRoles(filter, options);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Roles retrieved successfully', result.data, {
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    itemsPerPage: result.itemsPerPage
  }));
});

const getRole = catchAsync(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Role retrieved successfully', role));
});

const updateRole = catchAsync(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Role updated successfully', role));
});

const deleteRole = catchAsync(async (req, res) => {
  await roleService.deleteRole(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Role deleted successfully'));
});

export default {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
};
