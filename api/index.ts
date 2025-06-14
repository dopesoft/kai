import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register all routes
registerRoutes(app);

// Export for Vercel
export default app;