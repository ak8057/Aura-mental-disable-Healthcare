import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRouter from "./routes/authRoute.js";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`Received request at: ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRouter);

// Database connection
mongoose
  .connect("mongodb://127.0.0.1:27017/authentication")
  .then(() => console.log("Connection to database successfully done"))
  .catch((error) => console.error('Failed to connect to mongoDB', error));

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

// Test route
app.get('/', (req, res) => {
  res.send("hello world baby");
});

// Start server
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
