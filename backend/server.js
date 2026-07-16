require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const multer = require("multer");

const { sequelize } = require("./models");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const tagRoutes = require("./routes/tagRoutes");
const audienceRoutes = require("./routes/audienceRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();
const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://nexus-assignment-six.vercel.app",
  ...(process.env.CLIENT_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);

app.get("/api/health", (req, res) => res.json({ success: true }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());
app.use(helmet());

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/audiences", audienceRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "CSV file cannot exceed 2 MB"
          : error.message,
    });
  }

  if (error.message === "Only CSV files are allowed") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database Connected");

    await sequelize.sync();
    console.log("Database tables synced");

    app.listen(process.env.PORT || 4000, () => {
      console.log(
        `Server running on port ${process.env.PORT || 4000}`
      );
    });
  } catch (error) {
    console.error("Database Connection Failed", error);
    process.exit(1);
  }
}

startServer();
