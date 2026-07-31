import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import productService from './product.service.js';

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Product created successfully', product));
});

const getProducts = catchAsync(async (req, res) => {
  const filter = { 
    search: req.query.search, 
    categoryId: req.query.categoryId,
    brandId: req.query.brandId,
    isActive: req.query.isActive
  };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await productService.queryProducts(filter, options);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Products retrieved successfully', result.data, {
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    itemsPerPage: result.itemsPerPage
  }));
});

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Product retrieved successfully', product));
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Product updated successfully', product));
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Product deleted successfully'));
});

const addVariants = catchAsync(async (req, res) => {
  const product = await productService.addVariants(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Variants added successfully', product));
});

const updateVariant = catchAsync(async (req, res) => {
  const product = await productService.updateVariant(req.params.id, req.params.variantId, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Variant updated successfully', product));
});

const deleteVariant = catchAsync(async (req, res) => {
  await productService.deleteVariant(req.params.id, req.params.variantId);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Variant deleted successfully'));
});

const addMedia = catchAsync(async (req, res) => {
  const product = await productService.addMedia(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Media attached successfully', product));
});

const updateMediaAttachment = catchAsync(async (req, res) => {
  const product = await productService.updateMediaAttachment(req.params.id, req.params.mediaId, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Media attachment updated successfully', product));
});

const deleteMediaAttachment = catchAsync(async (req, res) => {
  await productService.deleteMediaAttachment(req.params.id, req.params.mediaId);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Media attachment deleted successfully'));
});

export default {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  addVariants,
  updateVariant,
  deleteVariant,
  addMedia,
  updateMediaAttachment,
  deleteMediaAttachment,
};
