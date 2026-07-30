import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import attributeService from './attribute.service.js';

const createAttribute = catchAsync(async (req, res) => {
  const attribute = await attributeService.createAttribute(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Attribute created successfully', attribute));
});

const getAttributes = catchAsync(async (req, res) => {
  const filter = { search: req.query.search, type: req.query.type };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await attributeService.queryAttributes(filter, options);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attributes retrieved successfully', result.data, {
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    itemsPerPage: result.itemsPerPage
  }));
});

const getAttribute = catchAsync(async (req, res) => {
  const attribute = await attributeService.getAttributeById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attribute retrieved successfully', attribute));
});

const updateAttribute = catchAsync(async (req, res) => {
  const attribute = await attributeService.updateAttribute(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attribute updated successfully', attribute));
});

const deleteAttribute = catchAsync(async (req, res) => {
  await attributeService.deleteAttribute(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attribute deleted successfully'));
});

export default {
  createAttribute,
  getAttributes,
  getAttribute,
  updateAttribute,
  deleteAttribute,
};
