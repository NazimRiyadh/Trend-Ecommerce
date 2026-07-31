import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';

import errorHandler from './middleware/errorHandler.js';
import authGuard from './middleware/authGuard.js';
import ApiError from './utils/ApiError.js';
import authRoutes from './modules/auth/auth.routes.js';
import permissionRoutes from './modules/permission/permission.routes.js';
import roleRoutes from './modules/role/role.routes.js';
import userRoutes from './modules/user/user.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import brandRoutes from './modules/brand/brand.routes.js';
import attributeRoutes from './modules/attribute/attribute.routes.js';
import productRoutes from './modules/product/product.routes.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Global Auth Guard (protects all routes by default, public routes opt out)
app.use(authGuard);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/products', productRoutes);

app.get('/health', (req, res) => {
  // We opt out health check
  req.skipAuth = true;
  res.status(StatusCodes.OK).json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, 'Not found'));
});

// Global error handler
app.use(errorHandler);

export default app;
