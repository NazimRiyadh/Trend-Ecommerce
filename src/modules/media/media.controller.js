import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import mediaService from './media.service.js';

const uploadFiles = catchAsync(async (req, res) => {
  const result = await mediaService.uploadFiles(req.files, req.user.id);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Files uploaded successfully', result));
});

const getMediaList = catchAsync(async (req, res) => {
  const filter = { search: req.query.search, type: req.query.type };
  const options = { page: req.query.page, limit: req.query.limit };
  
  const result = await mediaService.queryMedia(filter, options);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Media retrieved successfully', result.data, {
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    itemsPerPage: result.itemsPerPage
  }));
});

const getMedia = catchAsync(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Media retrieved successfully', media));
});

const updateMedia = catchAsync(async (req, res) => {
  const media = await mediaService.updateMedia(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Media metadata updated successfully', media));
});

const deleteMedia = catchAsync(async (req, res) => {
  await mediaService.deleteMedia(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Media deleted successfully'));
});

export default {
  uploadFiles,
  getMediaList,
  getMedia,
  updateMedia,
  deleteMedia,
};
