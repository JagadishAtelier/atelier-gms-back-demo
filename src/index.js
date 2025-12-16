// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import responseHelper from './middleware/responseHelper.js';
import userRoutes from './user/routes/index.js';
import gmsRoutes from './gms/index.js'; 
import path from "path";

const app = express();

// --- Middlewares ---
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

// CORS configuration
const allowedOrigin = '*'; 
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
  credentials: true, 
}));


// Logging & security
app.use(morgan('dev'));
app.use(helmet());

// Custom response helper
app.use(responseHelper);

// PDF inline headers
app.use((req, res, next) => {
  if (req.path.endsWith(".pdf")) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
  }
  next();
});

// Static uploads
app.use('/uploads', express.static('uploads'));

// --- Routes ---
app.get('/', (req, res) => {
  res.status(200).send("Hello World!!");
});

app.get('/api/data', (req, res) => {
  res.sendSuccess({ value: 42 }, 'Data fetched successfully');
});

app.get('/api/error', (req, res) => {
  res.sendError('Something went wrong', 422, [{ field: 'email', message: 'Invalid' }]);
});

// API versioned routes
app.use('/api/v1/', userRoutes);
app.use('/api/v1/', gmsRoutes);

// 404 fallback
app.use((req, res) => {
  return res.sendError('Route not found', 404);
});

export default app;
