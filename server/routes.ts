import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertForkliftSchema, insertCompanySchema } from "@shared/schema";
import { WebSocketServer } from 'ws';
import {updateCompanyUserSchema} from '@shared/schema'; // Added import

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Add this new route before the existing company routes
  app.get("/api/companies/:id/isAdmin", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }

    try {
      const isAdmin = await storage.isCompanyAdmin(req.user!.id, companyId);
      console.log(`Admin check for user ${req.user!.id} in company ${companyId}: ${isAdmin}`);
      res.json(isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  // Add this new route with the existing company routes
  app.get("/api/companies/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }

    try {
      // Check if user has access to this company
      const userCompanies = await storage.getUserCompanies(req.user!.id);
      const company = userCompanies.find(c => c.id === companyId);

      if (!company) {
        console.log(`User ${req.user!.id} attempted to access company ${companyId} but was denied`);
        return res.status(403).json({ error: "Access denied" });
      }

      console.log(`User ${req.user!.id} successfully accessed company ${companyId}`);
      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ error: "Failed to fetch company details" });
    }
  });

  // Protected routes - require authentication
  app.use("/api", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  });

  // Company routes
  app.post("/api/companies", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const parsed = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(parsed.name, req.user!.id);
      res.status(201).json(company);
    } catch (error) {
      console.error('Error creating company:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create company" });
      }
    }
  });

  app.post("/api/companies/join", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { joinCode } = req.body;
    if (!joinCode) {
      return res.status(400).json({ error: "Join code is required" });
    }

    try {
      const company = await storage.getCompanyByJoinCode(joinCode);
      if (!company) {
        return res.status(404).json({ error: "Invalid join code" });
      }

      await storage.addUserToCompany(req.user!.id, company.id);
      res.status(200).json(company);
    } catch (error) {
      console.error('Error joining company:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to join company" });
      }
    }
  });

  app.get("/api/companies", async (req, res) => {
    const companies = await storage.getUserCompanies(req.user!.id);
    res.json(companies);
  });

  // Get all users in a company
  app.get("/api/companies/:id/users", async (req, res) => {
    const companyId = parseInt(req.params.id);

    // Check if user has access and is admin
    const isAdmin = await storage.isCompanyAdmin(req.user!.id, companyId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only company admins can view user list" });
    }

    const users = await storage.getCompanyUsers(companyId);
    res.json(users);
  });

  // Update user permissions/status in company
  app.patch("/api/companies/:id/users/:userId", async (req, res) => {
    const companyId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    // Check if user is admin
    const isAdmin = await storage.isCompanyAdmin(req.user!.id, companyId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only company admins can modify user permissions" });
    }

    // Parse and validate update data
    const update = updateCompanyUserSchema.parse({
      userId: targetUserId,
      ...req.body
    });

    await storage.updateCompanyUser(companyId, update);
    res.sendStatus(200);
  });

  // Regenerate company join code
  app.post("/api/companies/:id/regenerate-code", async (req, res) => {
    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }

    // Check if user is admin
    const isAdmin = await storage.isCompanyAdmin(req.user!.id, companyId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only company admins can regenerate join codes" });
    }

    const newJoinCode = await storage.regenerateCompanyJoinCode(companyId);
    res.json({ joinCode: newJoinCode });
  });

  // Delete company endpoint
  app.delete("/api/companies/:id", async (req, res) => {
    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }

    // Check if user is admin
    const isAdmin = await storage.isCompanyAdmin(req.user!.id, companyId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only company admins can delete companies" });
    }

    await storage.deleteCompany(companyId);
    res.sendStatus(204);
  });


  // Get user's forklifts (including shared ones)
  app.get("/api/forklifts", async (req, res) => {
    const forklifts = await storage.getForkliftsByUserId(req.user!.id);
    res.json(forklifts);
  });

  // Create new forklift
  app.post("/api/forklifts", async (req, res) => {
    try {
      const parsed = insertForkliftSchema.parse(req.body);

      // Check if user has access to the company
      const userCompanies = await storage.getUserCompanies(req.user!.id);
      if (!userCompanies.some(company => company.id === parsed.companyId)) {
        return res.status(403).json({ error: "You don't have access to this company" });
      }

      const forklift = await storage.createForklift(req.user!.id, parsed);
      res.status(201).json(forklift);
    } catch (error) {
      console.error('Error creating forklift:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create forklift' });
      }
    }
  });

  // Update forklift
  app.patch("/api/forklifts/:id", async (req, res) => {
    const forklift = await storage.getForklift(parseInt(req.params.id));
    if (!forklift) return res.sendStatus(404);

    // Check if user has access to this forklift
    const forklifts = await storage.getForkliftsByUserId(req.user!.id);
    if (!forklifts.some(f => f.id === forklift.id)) {
      return res.sendStatus(403);
    }

    const parsed = insertForkliftSchema.partial().parse(req.body);
    const updated = await storage.updateForklift(forklift.id, parsed);
    res.json(updated);
  });

  // Delete forklift
  app.delete("/api/forklifts/:id", async (req, res) => {
    const forklift = await storage.getForklift(parseInt(req.params.id));
    if (!forklift) return res.sendStatus(404);

    // Check if user owns this forklift (only owners can delete)
    if (forklift.userId !== req.user!.id) {
      return res.sendStatus(403);
    }

    await storage.deleteForklift(forklift.id);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);

  // Setup WebSocket server with a specific path
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    // Add heartbeat to keep connections alive
    clientTracking: true,
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Keep connection alive with ping/pong
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      // Client responded to ping
      ws.isAlive = true;
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Cleanup dead connections
  setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  return httpServer;
}