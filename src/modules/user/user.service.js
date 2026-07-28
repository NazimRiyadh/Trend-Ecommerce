import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/prisma.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

const createUser = async (data) => {
  const { email, password, roleId } = data;

  if (await prisma.user.findUnique({ where: { email } })) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already taken');
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Role not found');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    include: { role: true }
  });

  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.refreshToken;

  return userResponse;
};

const queryUsers = async (filter, options) => {
  const { page, limit } = getPagination(options.page, options.limit);
  const { search, roleId, isActive } = filter;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(roleId && { roleId }),
    ...(isActive !== undefined && { isActive: isActive === 'true' }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: page,
      take: limit,
      include: {
        role: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  const usersResponse = users.map(user => {
    const { password, refreshToken, ...rest } = user;
    return rest;
  });

  return getPagingData(total, options.page, options.limit, usersResponse);
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true }
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.refreshToken;

  return userResponse;
};

const updateUser = async (id, updateBody, currentUser) => {
  const user = await prisma.user.findUnique({ where: { id } });
  
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Prevent self-escalation
  if (currentUser.id === id && updateBody.roleId && updateBody.roleId !== user.roleId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You cannot change your own role');
  }

  if (updateBody.email && updateBody.email !== user.email) {
    if (await prisma.user.findUnique({ where: { email: updateBody.email } })) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already taken');
    }
  }

  if (updateBody.roleId) {
    const role = await prisma.role.findUnique({ where: { id: updateBody.roleId } });
    if (!role) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Role not found');
    }
  }

  let dataToUpdate = { ...updateBody };

  if (updateBody.password) {
    dataToUpdate.password = await bcrypt.hash(updateBody.password, 10);
  }

  // If a user is deactivated, we clear their refresh token
  if (updateBody.isActive === false) {
    dataToUpdate.refreshToken = null;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: dataToUpdate,
    include: { role: true }
  });

  const userResponse = { ...updatedUser };
  delete userResponse.password;
  delete userResponse.refreshToken;

  return userResponse;
};

const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Hard delete
  await prisma.user.delete({
    where: { id },
  });
};

export default {
  createUser,
  queryUsers,
  getUserById,
  updateUser,
  deleteUser,
};
