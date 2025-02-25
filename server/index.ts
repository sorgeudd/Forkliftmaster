import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Initializing server...");

    // Initialize routes before setting up middleware
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

      log(`Error [${status}]: ${message}`);
      if (stack) log(stack);

      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack } : {})
      });
    });

    const port = 5000;
    const host = "0.0.0.0";

    log(`Attempting to start server on ${host}:${port}...`);

    try {
      if (process.env.NODE_ENV !== 'production') {
        log('Setting up Vite middleware...');
        await setupVite(app);
        log('Vite middleware setup complete');
      } else {
        log('Setting up static file serving...');
        serveStatic(app);
        log('Static file serving setup complete');
      }

      server.listen(port, host, () => {
        log(`✅ Server successfully started and listening on ${host}:${port}`);
        log(`Local URL: http://localhost:${port}`);
        log(`Network URL: http://${host}:${port}`);
      });

    } catch (error) {
      log(`❌ Failed to start server: ${error}`);
      process.exit(1);
    }

  } catch (error) {
    log(`❌ Failed to initialize application: ${error}`);
    process.exit(1);
  }
})();