import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import categoryService from './category.service.js';

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Category created successfully', category));
});

const getCategoryTree = catchAsync(async (req, res) => {
  const tree = await categoryService.getCategoryTree(req.query.isActive);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Category tree retrieved successfully', tree));
});

const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Category retrieved successfully', category));
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Category updated successfully', category));
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Category deleted successfully'));
});

export default {
  createCategory,
  getCategoryTree,
  getCategory,
  updateCategory,
  deleteCategory,
};
