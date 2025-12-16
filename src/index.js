import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import responseHelper from "./middleware/responseHelper.js";
import userRoutes from "./user/routes/index.js";
import gmsRoutes from "./gms/index.js";

const app = express();

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
    credentials: false,
  })
);

// Logging
app.use(morgan("dev"));

// 🔥 Helmet FIX
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Response helper
app.use(responseHelper);

// Serve uploads (cross-origin safe)
app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// Test routes
app.get("/", (req, res) => {
  res.status(200).send("Hello World!!");
});

// API routes
app.use("/api/v1", userRoutes);
app.use("/api/v1", gmsRoutes);

// 404
app.use((req, res) => {
  res.sendError("Route not found", 404);
});

export default app;
