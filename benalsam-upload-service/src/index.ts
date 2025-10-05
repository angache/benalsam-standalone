import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types/dist/server';
import fileUpload from 'express-fileupload';
import listingsRouter from './routes/listings';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3019;

const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach(mw => app.use(mw));

// Routes
app.use('/api/v1/listings', listingsRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Upload Service running on port ${PORT}`);
});
