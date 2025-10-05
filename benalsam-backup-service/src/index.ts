import express from 'express';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types/server';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3021;

const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);
securityMiddleware.getAllMiddleware().forEach(m => app.use(m));

app.use(express.json());
app.use('/api/v1', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backup Service running on port ${PORT}`);
});
