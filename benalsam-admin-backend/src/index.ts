import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types/server';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3002;

const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);
securityMiddleware.getAllMiddleware().forEach(m => app.use(m));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use('/api/v1', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Admin Backend running on port ${PORT}`);
});
