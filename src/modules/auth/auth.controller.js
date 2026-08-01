import authService from "./auth.service.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  path: "/",
};

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  // Set refresh token in HttpOnly cookie — never exposed to JS
  res.cookie("refreshToken", result.tokens.refreshToken, COOKIE_OPTIONS);

  // Return only user + accessToken in the response body
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, "Login successful", {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
      },
    }),
  );
});

const refresh = catchAsync(async (req, res) => {
  // Read refresh token from HttpOnly cookie (not request body)
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(new ApiResponse(StatusCodes.UNAUTHORIZED, "Refresh token missing"));
  }

  const tokens = await authService.refresh(refreshToken);

  // Rotate: set new refresh token cookie
  res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTIONS);

  // Only return the new accessToken in the body
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, "Tokens refreshed successfully", {
      accessToken: tokens.accessToken,
    }),
  );
});

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  await authService.logout(refreshToken);

  res.clearCookie("refreshToken", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Logout successful"));
});

const getSession = catchAsync(async (req, res) => {
  const session = await authService.getSession(req.user);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Session retrieved successfully",
        session,
      ),
    );
});

export default {
  login,
  refresh,
  logout,
  getSession,
};
