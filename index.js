import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import createPoolRouter from "./routes/create_pool.js";
import getPoolInfoRouter from "./routes/get_pool_info.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/launchpad", createPoolRouter);
app.use("/api/launchpad", getPoolInfoRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Launchpad API",
    endpoints: {
      createPool: "POST /api/launchpad/create",
      getPoolInfo: "GET /api/launchpad/info/poolProgression/:configAddress",
    },
  });
});

// Handle 404 errors for undefined routes
// This middleware catches any requests that don't match defined routes
// and returns a 404 error response
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
