import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import brandService from './brand.service.js';

const createBrand = catchAsync(async (req, res) => {
  const brand = await brandService.createBrand(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Brand created successfully', brand));
});

const getBrands = catchAsync(async (req, res) => {
  const filter = { search: req.query.search, status: req.query.status };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await brandService.queryBrands(filter, options);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Brands retrieved successfully', result.data, {
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    itemsPerPage: result.itemsPerPage
  }));
});

const getBrand = catchAsync(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Brand retrieved successfully', brand));
});

const updateBrand = catchAsync(async (req, res) => {
  const brand = await brandService.updateBrand(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Brand updated successfully', brand));
});

const deleteBrand = catchAsync(async (req, res) => {
  await brandService.deleteBrand(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Brand deleted successfully'));
});

export default {
  createBrand,
  getBrands,
  getBrand,
  updateBrand,
  deleteBrand,
};
