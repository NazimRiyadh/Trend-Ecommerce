import authService from './auth.service.js';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Login successful', result));
});

const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refresh(refreshToken);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Tokens refreshed successfully', tokens));
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Logout successful'));
});

const getSession = catchAsync(async (req, res) => {
  const session = await authService.getSession(req.user);
  
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Session retrieved successfully', session));
});

export default {
  login,
  refresh,
  logout,
  getSession
};
