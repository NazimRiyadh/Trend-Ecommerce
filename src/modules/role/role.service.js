import { StatusCodes } from "http-status-codes";
import ApiError from "../../utils/ApiError.js";
import prisma from "../../config/prisma.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";

const createRole = async (data) => {
  const { name, description, status, permissionIds, grantAll } = data;

  const existingRole = await prisma.role.findUnique({ where: { name } });
  if (existingRole) {
    throw new ApiError(StatusCodes.CONFLICT, "Role name already exists");
  }

  let finalPermissionIds = permissionIds || [];
  if (grantAll) {
    const allPermissions = await prisma.permission.findMany({
      select: { id: true },
    });
    finalPermissionIds = allPermissions.map((p) => p.id);
  }

  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        name,
        description,
        status,
      },
    });

    if (finalPermissionIds.length > 0) {
      const rolePermissionsData = finalPermissionIds.map((id) => ({
        roleId: role.id,
        permissionId: id,
      }));
      await tx.rolePermission.createMany({
        data: rolePermissionsData,
      });
    }

    return tx.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  });
};

const queryRoles = async (filter, options) => {
  const { page, limit } = getPagination(options.page, options.limit);
  const { search } = filter;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip: page,
      take: limit,
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.count({ where }),
  ]);

  return getPagingData(total, options.page, options.limit, roles);
};

const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: {
            include: { group: true },
          },
        },
      },
    },
  });

  if (!role) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found");
  }

  return role;
};

const updateRole = async (id, updateBody) => {
  const role = await getRoleById(id);
  const { name, description, status, permissionIds, grantAll } = updateBody;

  if (name && name !== role.name) {
    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      throw new ApiError(StatusCodes.CONFLICT, "Role name already exists");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedRole = await tx.role.update({
      where: { id },
      data: {
        name: name !== undefined ? name : role.name,
        description: description !== undefined ? description : role.description,
        status: status !== undefined ? status : role.status,
      },
    });

    if (grantAll !== undefined || permissionIds !== undefined) {
      let finalPermissionIds = permissionIds || [];
      if (grantAll) {
        const allPermissions = await tx.permission.findMany({
          select: { id: true },
        });
        finalPermissionIds = allPermissions.map((p) => p.id);
      }

      const currentPermissionIds = role.permissions.map(
        (rp) => rp.permissionId,
      );
      const toRemove = currentPermissionIds.filter(
        (pid) => !finalPermissionIds.includes(pid),
      );
      const toAdd = finalPermissionIds.filter(
        (pid) => !currentPermissionIds.includes(pid),
      );

      // Safety Guard: Check if we are removing critical permissions from the ONLY role that has them
      if (toRemove.length > 0) {
        for (const pid of toRemove) {
          const otherRolesHoldingPermission = await tx.rolePermission.count({
            where: {
              permissionId: pid,
              roleId: { not: id },
            },
          });

          if (otherRolesHoldingPermission === 0) {
            const perm = await tx.permission.findUnique({ where: { id: pid } });
            // Protect critical permissions like role:update
            if (
              ["role:update", "permission:update", "user:update"].includes(
                perm.name,
              )
            ) {
              throw new ApiError(
                StatusCodes.CONFLICT,
                `Cannot remove '${perm.name}' as this is the only role holding it`,
              );
            }
          }
        }
      }

      if (toRemove.length > 0) {
        await tx.rolePermission.deleteMany({
          where: {
            roleId: id,
            permissionId: { in: toRemove },
          },
        });
      }

      if (toAdd.length > 0) {
        await tx.rolePermission.createMany({
          data: toAdd.map((pid) => ({ roleId: id, permissionId: pid })),
        });
      }
    }

    return tx.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  });
};

const deleteRole = async (id) => {
  const role = await getRoleById(id);

  // Refuse if users hold it
  const userCount = await prisma.user.count({ where: { roleId: id } });
  if (userCount > 0) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `Cannot delete role. It is currently assigned to ${userCount} user(s).`,
    );
  }

  await prisma.role.delete({
    where: { id: role.id },
  });
};

export default {
  createRole,
  queryRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
