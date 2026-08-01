import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrendCommerce Admin API',
      version: '1.0.0',
      description: `
## TrendCommerce E-Commerce Admin Dashboard API

A complete REST API for managing an e-commerce admin dashboard built with **Node.js + Express + Prisma + PostgreSQL**.

### Authentication
This API uses **Bearer Token authentication** (JWT). To authenticate:
1. POST to \`/api/auth/login\` with your credentials
2. Copy the \`accessToken\` from the response
3. Click **Authorize** and enter: \`Bearer <your_accessToken>\`

### Test Accounts
| Account | Email | Password | Access |
|---------|-------|----------|--------|
| Super Admin | admin@trendcommerce.com | admin123 | Full access to all modules |
| Catalog Manager | catalog@trendcommerce.com | catalog123 | Catalog only (products, categories, brands, attributes, media) — **will get 403 on user/role/permission routes** |

### Modules
1. **Authentication** — Login, refresh, logout, session
2. **Permissions** — Manage system capabilities grouped by module
3. **Roles** — Bundles of permissions assigned to users
4. **Users** — Dashboard accounts with roles
5. **Media** — Shared file library with upload, thumbnail generation
6. **Categories** — Nested category tree
7. **Brands** — Product manufacturers/labels
8. **Attributes** — Product variation dimensions (Size, Color, etc.)
9. **Products** — Simple and variable products with variants, media, categories
      `,
      contact: {
        name: 'TrendCommerce API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token. Get one from POST /api/auth/login',
        },
      },
      schemas: {
        // Generic
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Validation Error' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                results: { type: 'array', items: {} },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                totalPages: { type: 'integer', example: 5 },
                totalResults: { type: 'integer', example: 48 }
              }
            }
          }
        },
        // Auth
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@trendcommerce.com' },
            password: { type: 'string', example: 'admin123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/UserPublic' },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
              }
            }
          }
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' }
          }
        },
        // User
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Admin User' },
            email: { type: 'string', format: 'email', example: 'admin@trendcommerce.com' },
            phone: { type: 'string', nullable: true },
            gender: { type: 'string', enum: ['male', 'female', 'other'], nullable: true },
            avatar: { type: 'string', nullable: true },
            isActive: { type: 'boolean', example: true },
            roleId: { type: 'string' },
            role: { $ref: '#/components/schemas/RoleSummary' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'roleId'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, example: 'secure123' },
            phone: { type: 'string', example: '01712345678' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            roleId: { type: 'string', description: 'Required. Role ID to assign.' },
            isActive: { type: 'boolean', default: true }
          }
        },
        // Role
        RoleSummary: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Super Admin' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['active', 'inactive'] },
            permissions: { type: 'array', items: { $ref: '#/components/schemas/PermissionSummary' } },
            _count: { type: 'object', properties: { users: { type: 'integer' } } }
          }
        },
        CreateRoleRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Editor' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
            permissionIds: { type: 'array', items: { type: 'string' }, description: 'Array of permission IDs to assign' },
            grantAll: { type: 'boolean', description: 'If true, grants ALL permissions to this role' }
          }
        },
        // Permission
        PermissionSummary: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'product:create' },
            description: { type: 'string', nullable: true }
          }
        },
        Permission: {
          allOf: [
            { $ref: '#/components/schemas/PermissionSummary' },
            {
              type: 'object',
              properties: {
                groupId: { type: 'string' },
                group: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          ]
        },
        CreatePermissionGroupRequest: {
          type: 'object',
          required: ['name', 'actions'],
          properties: {
            name: { type: 'string', example: 'product', description: 'Module name — will be lowercased and normalised' },
            description: { type: 'string' },
            actions: {
              type: 'array',
              items: { type: 'string' },
              example: ['watch', 'create', 'read', 'update', 'delete'],
              description: 'Standard and/or custom action names'
            }
          }
        },
        // Media
        Media: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fileName: { type: 'string' },
            publicUrl: { type: 'string' },
            mimeType: { type: 'string' },
            type: { type: 'string', enum: ['image', 'video'] },
            size: { type: 'integer' },
            width: { type: 'integer', nullable: true },
            height: { type: 'integer', nullable: true },
            thumbnailUrl: { type: 'string', nullable: true },
            altText: { type: 'string', nullable: true },
            title: { type: 'string', nullable: true },
            uploadedBy: { $ref: '#/components/schemas/UserPublic' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // Category
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            sortOrder: { type: 'integer' },
            parentId: { type: 'string', nullable: true },
            parent: { type: 'object', nullable: true },
            children: { type: 'array', items: {} }
          }
        },
        // Brand
        Brand: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['active', 'inactive'] },
            logoId: { type: 'string', nullable: true }
          }
        },
        // Attribute
        Attribute: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string', enum: ['dropdown', 'radio', 'checkbox', 'colour_swatch', 'image_swatch'] },
            values: { type: 'array', items: { $ref: '#/components/schemas/AttributeValue' } }
          }
        },
        AttributeValue: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'string' },
            slug: { type: 'string' },
            referenceValue: { type: 'string', nullable: true, description: 'Hex code for colour, mediaId for image swatch' }
          }
        },
        // Product
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            sku: { type: 'string' },
            hasVariants: { type: 'boolean' },
            price: { type: 'number', nullable: true },
            salePrice: { type: 'number', nullable: true },
            stock: { type: 'integer', nullable: true },
            stockStatus: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            brand: { $ref: '#/components/schemas/Brand' },
            categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            media: { type: 'array', items: {} },
            variants: { type: 'array', items: { $ref: '#/components/schemas/ProductVariant' } }
          }
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sku: { type: 'string' },
            price: { type: 'number' },
            salePrice: { type: 'number', nullable: true },
            stock: { type: 'integer' },
            stockStatus: { type: 'string' },
            isActive: { type: 'boolean' },
            attributeValues: { type: 'array', items: {} }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'Login, refresh tokens, logout, and session' },
      { name: 'Permissions', description: 'Manage system permission groups and actions' },
      { name: 'Roles', description: 'Manage roles and their permission assignments' },
      { name: 'Users', description: 'Manage dashboard user accounts' },
      { name: 'Media', description: 'Upload and manage shared media assets' },
      { name: 'Categories', description: 'Manage nested category tree' },
      { name: 'Brands', description: 'Manage product brands' },
      { name: 'Attributes', description: 'Manage product attributes and their values' },
      { name: 'Products', description: 'Manage products, variants, and media attachments' },
    ]
  },
  apis: ['./src/modules/**/*.routes.js', './src/modules/auth/auth.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
