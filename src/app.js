import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { StatusCodes } from "http-status-codes";
import path from "path";
import { fileURLToPath } from "url";

import errorHandler from "./middleware/errorHandler.js";
import authGuard from "./middleware/authGuard.js";
import ApiError from "./utils/ApiError.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import authRoutes from "./modules/auth/auth.routes.js";
import permissionRoutes from "./modules/permission/permission.routes.js";
import roleRoutes from "./modules/role/role.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import brandRoutes from "./modules/brand/brand.routes.js";
import attributeRoutes from "./modules/attribute/attribute.routes.js";
import productRoutes from "./modules/product/product.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/*
 * CORS
 *
 * The frontend sends an HttpOnly refresh-token cookie, so credentials must
 * remain enabled. Set CORS_ORIGIN to the exact deployed frontend URL.
 * Multiple origins can be supplied as a comma-separated list.
 */
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : ["http://localhost:5173", "http://localhost:5000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header include server-to-server requests,
      // health checks and tools such as Postman.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new ApiError(
          StatusCodes.FORBIDDEN,
          `CORS origin not allowed: ${origin}`,
        ),
      );
    },
    credentials: true,
  }),
);

/*
 * Global middleware
 */
app.use(
  helmet({
    // Swagger UI requires inline resources unless a custom CSP is configured.
    contentSecurityPolicy: false,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/*
 * Public API documentation
 */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "TrendCommerce API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }),
);

/*
 * Global API authentication
 *
 * Every route under /api is authenticated automatically. Only the public
 * authentication endpoints required by the assignment explicitly opt out.
 */
const publicApiPaths = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

app.use((req, res, next) => {
  const isApiRequest = req.path === "/api" || req.path.startsWith("/api/");

  // Dashboard pages, static assets, Swagger and health are not REST APIs.
  if (!isApiRequest) {
    return next();
  }

  if (publicApiPaths.has(req.path)) {
    req.skipAuth = true;
  }

  return authGuard(req, res, next);
});

/*
 * API routes
 *
 * Register every router exactly once and after the global API auth guard.
 */
app.use("/api/auth", authRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/products", productRoutes);

/*
 * Public deployment health check
 */
app.get("/health", (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Server is running",
  });
});

/*
 * API 404
 *
 * Prevent an unknown API endpoint from returning the React index page.
 * Unauthenticated API requests are stopped by authGuard first. An
 * authenticated request to an unknown endpoint reaches this JSON 404.
 */
app.use("/api", (req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, "API endpoint not found"));
});

/*
 * Production frontend
 */
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "..", "client", "dist");

  app.use(express.static(distPath));

  // Express 5 catch-all syntax. This supports React client-side routing.
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  /*
   * Development 404
   *
   * During development, Vite serves the frontend separately.
   */
  app.use((req, res, next) => {
    next(new ApiError(StatusCodes.NOT_FOUND, "Endpoint not found"));
  });
}

/*
 * Central error handler - must always remain last
 */
app.use(errorHandler);

export default app;
