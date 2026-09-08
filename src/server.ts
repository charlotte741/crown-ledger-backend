import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
import { connectDB } from './config/database';
// import { errorHandler } from './middleware/errorHandler';
import investmentRoutes from './routes/investmentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import savingsPlansRoutes from './routes/savingsPlansRoutes';
import investmentService from './services/investmentService';
import adminRoutes from './routes/adminRoutes';
// import stripeWebhookController from './controllers/stripeWebhookController';
import paymentRoutes from './routes/paymentRoutes';
import savingsRoutes from './routes/savingsRoute';
import contactSupportRoutes from './routes/contactSupportRoutes';
import walletRoutes from './routes/walletRoutes';
import DailyGrowthJob from './jobs/dailyGrowthJobs';


const app: Express = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Stripe webhook route - must be BEFORE express.json() middleware
// app.post(
//   '/api/webhooks/stripe',
//   express.raw({ type: 'application/json' }),
//   (req: Request, res: Response) =>
//     stripeWebhookController.handleWebhook(req, res)
// );

// Middleware
const allowedOrigins = [
  "http://localhost:5173",      // Local Vite
  "http://localhost:3000",      // Optional
  "https://crownledger360.com", // Production
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (Postman, mobile apps, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token", "x-new-access-token"],
    exposedHeaders: ["x-new-access-token", "x-refresh-token"],
  })
);
// Body parsing middleware with increased size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('[v0] Incoming request:', 
    {
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type'],
    bodyExists: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
  });
  next();
});

// Connect to database
connectDB();

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Investment Backend is running',
    timestamp: new Date(),
  });
});

// Seed initial data endpoint
app.post('/api/seed', async (req: Request, res: Response) => {
  try {
    await investmentService.seedInvestmentPlans();
    res.status(200).json({
      success: true,
      message: 'Investment plans seeded successfully',
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Auth routes (uncomment when auth controller is connected)
app.use('/api/auth', authRoutes);

// Settings routes (uncomment when settings controller is connected)
app.use('/api/settings', settingsRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Investment routes
app.use('/api/investments', investmentRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/savings', savingsRoutes);

app.use('/api/savings-plans', savingsPlansRoutes);

// Contact Support routes
app.use('/api/support', contactSupportRoutes);

app.use('/api/admin', adminRoutes);

// Wallet routes
app.use('/api/wallet', walletRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
// app.use(errorHandler);

DailyGrowthJob.start();

// Start server
app.listen(PORT, () => {
  console.log(`Investment Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;