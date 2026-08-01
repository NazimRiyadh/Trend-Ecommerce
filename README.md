# TrendCommerce Admin Dashboard

TrendCommerce is an e-commerce administration system built for the Trends Bird Limited Backend Developer Intern assignment. It provides a REST API for authentication, role-based access control, permissions, roles, users, media, categories, brands, attributes, and products, together with a React dashboard that demonstrates the implemented backend flows.

The backend uses Node.js, Express, Prisma, and PostgreSQL. The dashboard uses React, Vite, Tailwind CSS, and shadcn/ui. Product media is stored in Cloudinary, with automatic image-thumbnail generation.

## Links

| Resource | URL |
| --- | --- |
| Live application | `https://YOUR-RENDER-URL.onrender.com` |
| Live Swagger documentation | `https://YOUR-RENDER-URL.onrender.com/api-docs` |
| GitHub repository | https://github.com/NazimRiyadh/Trend-Ecommerce |
| Local Swagger documentation | http://localhost:5000/api-docs |

> **Required before submission:** replace `YOUR-RENDER-URL` with the exact Render service URL in both live links.

## Seeded Account Credentials

Run `npm run seed` before using these accounts.

| Account | Email | Password | Access |
| --- | --- | --- | --- |
| Super Admin | `admin@trendcommerce.com` | `admin123` | Full access to all modules and permissions |
| Catalog Manager | `catalog@trendcommerce.com` | `catalog123` | Catalog modules only; users, roles, and permissions return `403 Forbidden` |

The Catalog Manager is deliberately restricted so API-level permission enforcement can be reviewed quickly.

## Key Features

- JWT access and refresh-token authentication with rotation and server-side revocation.
- HttpOnly refresh cookie; refresh tokens are never returned in API response bodies.
- Global API authentication and per-route permission enforcement.
- Permission groups with generated lowercase `module:action` names.
- Roles with synchronized permission assignments and safety guards.
- User creation with an explicit role, activation/deactivation, and self-escalation prevention.
- Shared Cloudinary media library with content-based MIME validation and image thumbnails.
- Nested category trees with cycle prevention and collision-safe slugs.
- Brands with optional logos selected from the media library.
- Attributes and values with uniqueness and usage protection.
- Simple and variable products with variants, media, categories, brands, stock, and pricing validation.
- Prisma transactions for multi-table writes.
- Interactive Swagger documentation for all implemented routes.
- Permission-aware React navigation and actions.

## Technology Stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 22 |
| Backend | Express 5, JavaScript ES modules |
| Database | PostgreSQL |
| ORM and migrations | Prisma 7 |
| Authentication | JSON Web Tokens, HttpOnly cookies, bcrypt |
| Validation | Joi |
| Media | Multer, file-type, Sharp, Cloudinary |
| API documentation | swagger-jsdoc, Swagger UI Express |
| Frontend | React 19, Vite, React Router, Axios |
| UI | Tailwind CSS, shadcn/ui, Radix UI |

## Project Structure

```text
TrendCommerce/
|-- client/                  React dashboard
|   |-- src/api/             Axios client and API modules
|   |-- src/components/      Shared UI and layout components
|   |-- src/context/         Authentication/session context
|   `-- src/pages/           Dashboard module screens
|-- prisma/
|   |-- migrations/          Committed database migrations
|   `-- schema.prisma        Database schema
|-- src/
|   |-- config/              Environment, Prisma, Cloudinary, Swagger
|   |-- middleware/          Authentication, permission, validation, errors
|   |-- modules/             Routes, controllers, services, validation
|   `-- utils/               Response, error, paging, and slug helpers
|-- .env.example             Environment template
|-- render.yaml              Render Blueprint configuration
|-- seed.js                  Permission, role, user, and sample-data seed
`-- package.json             Commands and dependencies
```

## Local Setup

### Prerequisites

- Node.js 22.x
- npm
- PostgreSQL 14 or newer
- A Cloudinary account for media upload testing

### 1. Clone the repository

```bash
git clone https://github.com/NazimRiyadh/Trend-Ecommerce.git
cd Trend-Ecommerce
```

### 2. Install dependencies

```bash
npm install
npm --prefix client install
```

For a clean lockfile-based installation, use `npm ci` and `npm --prefix client ci`.

### 3. Create the environment file

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with a valid PostgreSQL URL, independent JWT secrets, the allowed frontend origin, and Cloudinary credentials.

### 4. Create an empty PostgreSQL database

Create a database named `trendcommerce`, or use another name and update `DATABASE_URL`.

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/trendcommerce
```

### 5. Run the committed migrations

```bash
npm run migrate:deploy
```

This applies the committed migrations from `prisma/migrations` and moves an empty database to the current schema. `prisma db push` is not required.

### 6. Seed required data

```bash
npm run seed
```

The seed is safe to run more than once. It creates or updates:

- All required permissions.
- The Super Admin role with every permission.
- The deliberately restricted Catalog Manager role.
- The two required users shown above.
- Sample categories, brands, attributes, and attribute values.

### 7. Run in development

Terminal 1 - backend API:

```bash
npm run dev
```

Terminal 2 - React dashboard:

```bash
npm --prefix client run dev
```

Open:

- Dashboard: http://localhost:5173
- API: http://localhost:5000/api
- Swagger: http://localhost:5000/api-docs
- Health check: http://localhost:5000/health

### 8. Run a production build locally

```bash
npm --prefix client run build
npm start
```

Set `NODE_ENV=production` when testing the combined deployment. Express then serves `client/dist`, and the dashboard and API use the same origin.

## Environment Variables

Do not commit `.env` or real credentials.

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `PORT` | No | Express port; defaults to `5000` | `5000` |
| `NODE_ENV` | Yes | Runtime mode | `development` |
| `DATABASE_URL` | Yes | PostgreSQL connection URL | `postgresql://postgres:password@localhost:5432/trendcommerce` |
| `JWT_ACCESS_SECRET` | Yes | Access-token signing secret | A long random value |
| `JWT_REFRESH_SECRET` | Yes | Separate refresh-token signing secret | A different long random value |
| `JWT_ACCESS_EXPIRY` | No | Access-token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | No | Refresh-token lifetime | `30d` |
| `CORS_ORIGIN` | Yes | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |
| `VITE_API_URL` | Development only | Client API base; production defaults to `/api` | `http://localhost:5000/api` |
| `UPLOAD_DIR` | No | Legacy/local upload fallback | `./uploads` |
| `MAX_FILE_SIZE` | No | Maximum upload size in bytes | `10485760` |
| `ALLOWED_MIME_TYPES` | No | Comma-separated media allowlist | `image/jpeg,image/png,image/webp,image/gif,video/mp4` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name | Your cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key | Your API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret | Your API secret |
| `CLOUDINARY_FOLDER` | No | Cloudinary folder prefix | `trendcommerce` |

Use different values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Production secrets must be supplied by the hosting platform and never committed.

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with Nodemon |
| `npm start` | Run the API with Node |
| `npm run migrate:deploy` | Apply committed Prisma migrations |
| `npm run seed` | Seed permissions, roles, users, and sample data |
| `npm run lint` | Lint the project |
| `npm run format` | Format source with Prettier |
| `npm --prefix client run dev` | Run the Vite development server |
| `npm --prefix client run build` | Build the dashboard for production |
| `npm --prefix client run lint` | Lint the dashboard |

## API Documentation

Swagger UI documents all implemented routes across the nine modules.

- Local: http://localhost:5000/api-docs
- Production: `https://YOUR-RENDER-URL.onrender.com/api-docs`

To call a protected route in Swagger:

1. Call `POST /api/auth/login` with a seeded account.
2. Copy `data.tokens.accessToken` from the response.
3. Select **Authorize**.
4. Enter `Bearer <accessToken>`.
5. Call protected endpoints.

The refresh token is intentionally unavailable to JavaScript because it is delivered as an HttpOnly cookie. Swagger and the browser send it automatically when operating on the same origin.

## Token Strategy

TrendCommerce uses a hybrid JWT strategy:

- The **access token** is a short-lived JWT with a 15-minute lifetime. It is returned by login/refresh and sent as `Authorization: Bearer <token>`.
- The frontend stores only this short-lived access token in `localStorage`.
- The **refresh token** is a 30-day JWT with a unique `jti`.
- It is delivered in an `HttpOnly` cookie. In production the cookie is also `Secure` and `SameSite=Strict`.
- No response contains the refresh token, and frontend JavaScript cannot read it.
- Only a one-way representation of the refresh token is stored in PostgreSQL.
- Every successful refresh rotates the refresh token and replaces its stored hash. Reusing the previous token returns `401 Unauthorized`.
- Logout revokes the stored refresh token server-side before clearing the cookie.
- Inactive users cannot log in or refresh.
- Wrong-email and wrong-password attempts return the same response.

The frontend uses `withCredentials: true`. When an access token expires, one refresh request is made and concurrent failed requests wait behind that single in-flight refresh. If refreshing fails, the session is cleared and the user returns to login.

### CSRF and CORS

The refresh cookie uses `SameSite=Strict` in production. CORS accepts credentials only from origins listed in `CORS_ORIGIN`; arbitrary origins are rejected. Protected business APIs additionally require the explicit access-token Bearer header.

## Access-Control Design

Every REST endpoint under `/api` passes through the global authentication middleware. These assignment-required authentication endpoints explicitly opt out:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

`GET /health` and `/api-docs` are public operational/documentation resources, not protected business APIs.

Protected endpoints declare `requirePermission("module:action")`. The middleware compares that declaration with the authenticated user's current role permissions.

- Missing, malformed, expired, or wrongly signed token: `401 Unauthorized`.
- Inactive or deleted account: `401 Unauthorized`.
- Valid token without the required permission: `403 Forbidden`.
- Predictable validation error: `400 Bad Request`.
- Missing record: `404 Not Found`.
- Duplicate or protected relationship conflict: `409 Conflict`.

The authentication guard reloads the user, role, and permissions on every request. A role change or deactivation therefore takes effect on the user's **next API request**.

Additional safety rules include:

- A user cannot change their own role.
- A role cannot be deleted while users hold it.
- The final role capable of managing roles cannot lose the critical management permission.
- Upload and nested product/variant routes are permission protected.

## Notable Design Decisions

### Validation and response format

Joi schemas are applied across the API modules to validate request bodies, query parameters, and route parameters before controller/service logic. Successful responses use `ApiResponse`; expected failures use `ApiError`; the central error middleware produces consistent JSON and prevents stack traces or database internals from being returned.

### Transactions

Multi-table writes use Prisma transactions, including permission groups and actions, role-permission synchronization, attributes with values, and products with categories, media, variants, and variant attributes.

### Media

Uploads are checked against both the configured MIME allowlist and detected file content. Images are stored in Cloudinary, and Sharp produces a Cloudinary-hosted thumbnail. PostgreSQL stores reusable media metadata.

### Slugs and conflicts

Slugs are normalized to lowercase. Collision-safe suffixes are generated where duplicate display names are allowed. Unique constraints and service checks return `409 Conflict` instead of exposing raw database errors.

### Delete behavior

- **Users:** hard delete; deactivation is available when history should be preserved.
- **Roles:** refused while users hold the role.
- **Categories:** refused when children or products depend on the category.
- **Brands:** refused when products reference the brand.
- **Attributes/values:** refused where variants depend on the value.
- **Products:** hard delete with cascading product joins and variants; shared media assets remain in the library.
- **Media:** hard delete removes Cloudinary assets and the database record when deletion is allowed.

## Module Status

The assignment requires each module to be marked **Complete**, **Partial**, or **Not attempted**. These statuses cover both API and dashboard behavior.

| # | Module | Status | Implemented scope |
| ---: | --- | --- | --- |
| 1 | Authentication | **Complete** | Login, identical credential errors, access token, HttpOnly refresh cookie, rotation, session, inactive-user checks, public real logout, transparent frontend refresh |
| 2 | Permission | **Complete** | Groups, generated lowercase actions, custom actions, grouped/searchable/paginated list, CRUD, duplicate protection |
| 3 | Role | **Complete** | Create with permissions, list/read/update, synchronization, grant-all, user count, in-use deletion guard, last-manager safety guard |
| 4 | User | **Complete** | Required role, search/filter/pagination, CRUD, activation/deactivation, immediate role changes, self-escalation prevention, password omission |
| 5 | Media | **Complete** | Multiple upload, content-based MIME validation, Cloudinary storage, thumbnails, filtering, metadata editing, safe deletion |
| 6 | Category | **Complete** | Root/child CRUD, recursive tree, parent selection, collision-safe slugs, cycle prevention, dependency-aware deletion |
| 7 | Brand | **Complete** | CRUD, search/pagination, normalized uniqueness, description/status, optional media-library logo, deletion guard |
| 8 | Attribute | **Complete** | Types, values, uniqueness within an attribute, CRUD, variant-usage protection |
| 9 | Product | **Partial** | Backend supports simple/variable products, transactions, variants, combinations, categories, brands, media joins, thumbnails, filters, sorting and pagination. Dashboard supports creation and basic editing; advanced edit-time variant/media synchronization is incomplete. |

No module was completely unattempted.

## Known Issues

- **Advanced product editing in the dashboard is partial.** The edit form updates primary fields, categories, brand, and simple-product price/stock. Existing variant and media changes should currently use the documented nested API routes in Swagger.
- **Variant-specific and attribute-value-specific media are backend/API features but are not fully submitted by the dashboard product form.** The dashboard exposes a variant image selector, but the selected value is not yet included in the create/update payload.
- **Gallery reordering has no drag-and-drop control.** Initial `sortOrder` follows selection order; join metadata can be updated through the API.
- **Deleting the final variant of a variable product is not blocked.** Clients should keep at least one variant when `hasVariants=true`.
- **A few list endpoints rely on service-level pagination/filter defaults instead of a dedicated Joi query schema.** Create, update, delete, and nested route inputs are validated, but query validation can be made more uniform.
- **Automated tests are not included.** Tests were optional in the assignment; verification was performed through the documented API and manual end-to-end flows.
- **Bonus items are not implemented:** TypeScript conversion, login rate limiting, refresh-token family/reuse detection, audit logging, and Docker Compose.

## Deployment with Render

The repository includes `render.yaml`, defining one Node web service and one PostgreSQL database in the Singapore region.

1. Push the final source and committed migrations to the default branch.
2. In Render, select **New > Blueprint** and connect this repository.
3. Supply `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
4. Set `CORS_ORIGIN` to the exact deployed Render URL.
5. Create the Blueprint resources.
6. Confirm the migration command completes.
7. Confirm the initial seed hook creates both accounts.
8. Replace the `YOUR-RENDER-URL` placeholders and push the final README update.

Blueprint commands:

```text
Build:      npm ci && npm --prefix client ci && npm --prefix client run build && npx prisma generate
Pre-deploy: npm run migrate:deploy
First seed: npm run seed
Start:      npm start
Health:     /health
```

## Submission Checklist

- [ ] GitHub repository is public, or the reviewer account has been added.
- [x] Full source and incremental commit history are present.
- [x] Prisma migrations are committed.
- [x] Exact migration and seed commands are documented.
- [x] Swagger covers the implemented routes.
- [ ] Live application and Swagger placeholders have been replaced.
- [x] Seeded credentials are documented.
- [x] Token strategy and design decisions are documented.
- [x] Module statuses and known issues are documented honestly.
- [ ] Live Super Admin and Catalog Manager logins have been verified.

## License

This repository was created as a technical assignment submission for Trends Bird Limited.
