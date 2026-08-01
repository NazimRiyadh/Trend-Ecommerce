import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import config from "../../config/index.js";
import prisma from "../../config/prisma.js";
import { randomUUID, createHash } from "node:crypto";

const generateTokens = (userId, roleId) => {
  const accessToken = jwt.sign({ userId, roleId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
    jwtid: randomUUID(),
  });

  return { accessToken, refreshToken };
};

const hashToken = (token) => {
  return createHash("sha256").update(token).digest("hex");
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect email or password");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect email or password");
  }

  const tokens = generateTokens(user.id, user.roleId);

  // Store hashed refresh token in DB for revocation
  const hashedRefreshToken = await bcrypt.hash(
    hashToken(tokens.refreshToken),
    10,
  );
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  delete userWithoutPassword.refreshToken;

  return { user: userWithoutPassword, tokens };
};

const refresh = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || !user.isActive || !user.refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Please authenticate");
  }

  const isTokenMatch = await bcrypt.compare(
    hashToken(token),
    user.refreshToken,
  );
  if (!isTokenMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  const tokens = generateTokens(user.id, user.roleId);

  // Rotate refresh token
  const hashedRefreshToken = await bcrypt.hash(
    hashToken(tokens.refreshToken),
    10,
  );
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  return tokens;
};

const logout = async (token) => {
  if (!token) {
    return;
  }

  let payload;

  try {
    payload = jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    // Always allow the browser to clear an invalid/expired cookie
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user?.refreshToken) {
    return;
  }

  const isTokenMatch = await bcrypt.compare(
    hashToken(token),
    user.refreshToken,
  );

  if (!isTokenMatch) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: null },
  });
};

const getSession = async (user) => {
  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isActive: user.isActive,
  };

  const role = {
    id: user.role.id,
    name: user.role.name,
  };

  const permissions = user.role.permissions.map((rp) => rp.permission.name);

  return { user: userResponse, role, permissions };
};

export default {
  login,
  refresh,
  logout,
  getSession,
};
