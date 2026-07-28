import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import userService from './user.service.js';

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'User created successfully', user));
});

const getUsers = catchAsync(async (req, res) => {
  const filter = { 
    search: req.query.search,
    roleId: req.query.roleId,
    isActive: req.query.isActive
  };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await userService.queryUsers(filter, options);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Users retrieved successfully', result.data, {
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    itemsPerPage: result.itemsPerPage
  }));
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'User retrieved successfully', user));
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'User updated successfully', user));
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'User deleted successfully'));
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
