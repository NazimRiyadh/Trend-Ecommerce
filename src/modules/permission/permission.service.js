  import { StatusCodes } from 'http-status-codes';
  import ApiError from '../../utils/ApiError.js';
  import prisma from '../../config/prisma.js';
  import { getPagination, getPagingData } from '../../utils/pagination.js';

  const createPermissionGroup = async (data) => {
    const { name, description, actions } = data;
    const groupName = name.toLowerCase();

    // Check if group exists
    const existingGroup = await prisma.permissionGroup.findUnique({
      where: { name: groupName },
    });

    if (existingGroup) {
      throw new ApiError(StatusCodes.CONFLICT, 'Permission group already exists');
    }

    // Create group and all permissions atomically
    return prisma.$transaction(async (tx) => {
      const group = await tx.permissionGroup.create({
        data: {
          name: groupName,
          description,
        },
      });

      const permissionsData = actions.map(action => ({
        name: `${groupName}:${action.toLowerCase()}`,
        groupId: group.id,
        description: `Can ${action.toLowerCase()} ${groupName}`,
      }));

      await tx.permission.createMany({
        data: permissionsData,
      });

      return tx.permissionGroup.findUnique({
        where: { id: group.id },
        include: { permissions: true },
      });
    });
  };

  const queryPermissionGroups = async (filter, options) => {
    const { page, limit, skip } = getPagination(options.page, options.limit);
    const { search } = filter;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { permissions: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    } : {};

    const [groups, total] = await Promise.all([
      prisma.permissionGroup.findMany({
        where,
        skip,
        take: limit,
        include: { permissions: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.permissionGroup.count({ where })
    ]);

    return getPagingData(total, options.page, options.limit, groups);
  };

  const getPermissionGroupById = async (id) => {
    const group = await prisma.permissionGroup.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!group) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Permission group not found');
    }

    return group;
  };

  const updatePermissionGroup = async (id, updateBody) => {
    const group = await getPermissionGroupById(id);
    
    const { name, description, actions } = updateBody;
    const groupName = name ? name.toLowerCase() : group.name;

    if (name && groupName !== group.name) {
      const existingGroup = await prisma.permissionGroup.findUnique({
        where: { name: groupName },
      });
      if (existingGroup) {
        throw new ApiError(StatusCodes.CONFLICT, 'Permission group already exists');
      }
    }

    return prisma.$transaction(async (tx) => {
      // Update group details
      const updatedGroup = await tx.permissionGroup.update({
        where: { id },
        data: {
          name: groupName,
          description: description !== undefined ? description : group.description,
        },
      });

      // If actions are provided, sync permissions
      if (actions) {
        const targetPermissions = actions.map(action => `${groupName}:${action.toLowerCase()}`);
        
        const currentPermissions = group.permissions.map(p => p.name);
        
        const toAdd = targetPermissions.filter(p => !currentPermissions.includes(p));
        const toRemove = currentPermissions.filter(p => !targetPermissions.includes(p));

        if (toRemove.length > 0) {
          await tx.permission.deleteMany({
            where: {
              groupId: group.id,
              name: { in: toRemove }
            }
          });
        }

        if (toAdd.length > 0) {
          const newPermissionsData = toAdd.map(name => ({
            name,
            groupId: group.id,
            description: `Auto-generated permission: ${name}`,
          }));
          await tx.permission.createMany({
            data: newPermissionsData,
          });
        }
        
        // If group name changed, we also need to rename existing permissions
        if (name && groupName !== group.name) {
          const remainingPermissions = currentPermissions.filter(p => !toRemove.includes(p));
          for (const p of remainingPermissions) {
            const actionPart = p.split(':')[1];
            await tx.permission.update({
              where: { name: p },
              data: { name: `${groupName}:${actionPart}` }
            });
          }
        }
      }

      return tx.permissionGroup.findUnique({
        where: { id },
        include: { permissions: true },
      });
    });
  };

  const deletePermissionGroup = async (id) => {
    const group = await getPermissionGroupById(id);
    
    // Cascade delete handles role links because of onDelete: Cascade in schema
    await prisma.permissionGroup.delete({
      where: { id: group.id },
    });
  };

  export default {
    createPermissionGroup,
    queryPermissionGroups,
    getPermissionGroupById,
    updatePermissionGroup,
    deletePermissionGroup,
  };
