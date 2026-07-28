import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import permissionService from './permission.service.js';

const createPermissionGroup = catchAsync(async (req, res) => {
  const group = await permissionService.createPermissionGroup(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Permission group created', group));
});

const getPermissionGroups = catchAsync(async (req, res) => {
  const filter = { search: req.query.search };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await permissionService.queryPermissionGroups(filter, options);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Permissions retrieved successfully', result.data, {
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    itemsPerPage: result.itemsPerPage
  }));
});

const getPermissionGroup = catchAsync(async (req, res) => {
  const group = await permissionService.getPermissionGroupById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Permission retrieved successfully', group));
});

const updatePermissionGroup = catchAsync(async (req, res) => {
  const group = await permissionService.updatePermissionGroup(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Permission group updated successfully', group));
});

const deletePermissionGroup = catchAsync(async (req, res) => {
  await permissionService.deletePermissionGroup(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Permission group deleted successfully'));
});

export default {
  createPermissionGroup,
  getPermissionGroups,
  getPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
};
