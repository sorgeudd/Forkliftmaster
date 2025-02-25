import { pgTable, text, serial, integer, timestamp, unique, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from 'nanoid';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

export const userCompanies = pgTable("user_companies", {
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
}, (table) => ({
  pk: unique().on(table.userId, table.companyId),
}));

export const forklifts = pgTable("forklifts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  customer: text("customer").notNull(),
  brand: text("brand").notNull(),
  modelType: text("model_type").notNull(),
  serialNumber: text("serial_number"),
  engineSpecs: text("engine_specs"),
  transmission: text("transmission"),
  tireSpecs: text("tire_specs"),
  serviceNotes: text("service_notes"),
  lastServiceDate: timestamp("last_service_date", { mode: 'string' }),
  nextServiceDate: timestamp("next_service_date", { mode: 'string' }),
  serviceHours: integer("service_hours"),
  // Service interval fields
  filters500h: text("filters_500h"),
  lubricants500h: text("lubricants_500h"),
  documents500h: text("documents_500h"),
  filters1000h: text("filters_1000h"),
  lubricants1000h: text("lubricants_1000h"),
  documents1000h: text("documents_1000h"),
  filters1500h: text("filters_1500h"),
  lubricants1500h: text("lubricants_1500h"),
  documents1500h: text("documents_1500h"),
  filters2000h: text("filters_2000h"),
  lubricants2000h: text("lubricants_2000h"),
  documents2000h: text("documents_2000h"),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
});

// Company schemas
export const insertCompanySchema = createInsertSchema(companies, {
  name: z.string().min(1, "Company name is required"),
}).omit({ id: true, createdAt: true, joinCode: true, createdBy: true });

// Forklift schemas with improved validation
export const insertForkliftSchema = createInsertSchema(forklifts, {
  companyId: z.number().int().min(1, "Company is required"),
  customer: z.string().min(1, "Customer name is required"),
  brand: z.string().min(1, "Brand is required"),
  modelType: z.string().min(1, "Model type is required"),
  serialNumber: z.string().optional(),
  engineSpecs: z.string().optional(),
  transmission: z.string().optional(),
  tireSpecs: z.string().optional(),
  serviceNotes: z.string().optional(),
  lastServiceDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  serviceHours: z.number().int().optional(),
  // Service interval validations
  filters500h: z.string().optional(),
  lubricants500h: z.string().optional(),
  documents500h: z.string().optional(),
  filters1000h: z.string().optional(),
  lubricants1000h: z.string().optional(),
  documents1000h: z.string().optional(),
  filters1500h: z.string().optional(),
  lubricants1500h: z.string().optional(),
  documents1500h: z.string().optional(),
  filters2000h: z.string().optional(),
  lubricants2000h: z.string().optional(),
  documents2000h: z.string().optional(),
}).omit({ id: true, userId: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Forklift = typeof forklifts.$inferSelect;
export type InsertForklift = z.infer<typeof insertForkliftSchema>;

// Helper function to generate a unique join code
export function generateJoinCode(): string {
  return nanoid(8).toUpperCase();
}

// New schema for company user management
export const updateCompanyUserSchema = z.object({
  userId: z.number().int(),
  isAdmin: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
});

// Export additional types for company management
export type CompanyUser = {
  userId: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  isBlocked: boolean;
  joinedAt: string;
};

export type UpdateCompanyUser = z.infer<typeof updateCompanyUserSchema>;