import { users, companies, userCompanies, forklifts, type User, type InsertUser, type Company, type InsertCompany, type Forklift, type InsertForklift, generateJoinCode } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createCompany(name: string, userId: number): Promise<Company>;
  getCompanyByJoinCode(joinCode: string): Promise<Company | undefined>;
  getUserCompanies(userId: number): Promise<Company[]>;
  addUserToCompany(userId: number, companyId: number): Promise<void>;
  isUserInCompany(userId: number, companyId: number): Promise<boolean>;

  getForkliftsByUserId(userId: number): Promise<Forklift[]>;
  getForklift(id: number): Promise<Forklift | undefined>;
  createForklift(userId: number, forklift: InsertForklift): Promise<Forklift>;
  updateForklift(id: number, forklift: Partial<InsertForklift>): Promise<Forklift>;
  deleteForklift(id: number): Promise<void>;

  // Company management methods
  getCompanyUsers(companyId: number): Promise<CompanyUser[]>;
  updateCompanyUser(companyId: number, update: UpdateCompanyUser): Promise<void>;
  isCompanyAdmin(userId: number, companyId: number): Promise<boolean>;
  regenerateCompanyJoinCode(companyId: number): Promise<string>;
  deleteCompany(companyId: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createCompany(name: string, userId: number): Promise<Company> {
    try {
      const joinCode = generateJoinCode();
      console.log(`Creating company "${name}" for user ${userId}`);

      // Start a transaction to ensure both operations succeed or fail together
      return await db.transaction(async (tx) => {
        // Create the company
        const [company] = await tx
          .insert(companies)
          .values({
            name,
            joinCode,
            createdBy: userId
          })
          .returning();

        if (!company) {
          throw new Error('Failed to create company');
        }

        console.log(`Company created with ID ${company.id}`);

        // Add the creating user as an admin
        await tx
          .insert(userCompanies)
          .values({
            userId,
            companyId: company.id,
            isAdmin: true,
            isBlocked: false
          });

        console.log(`User ${userId} added as admin to company ${company.id}`);
        return company;
      });
    } catch (error) {
      console.error('Error creating company:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create company: ${error.message}`);
      }
      throw new Error('Failed to create company: Unknown error occurred');
    }
  }

  async getCompanyByJoinCode(joinCode: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.joinCode, joinCode));
    return company;
  }

  async getUserCompanies(userId: number): Promise<Company[]> {
    const result = await db
      .select({
        company: companies,
      })
      .from(userCompanies)
      .innerJoin(
        companies,
        eq(companies.id, userCompanies.companyId)
      )
      .where(eq(userCompanies.userId, userId));

    return result.map(row => row.company);
  }

  async addUserToCompany(userId: number, companyId: number): Promise<void> {
    try {
      const [existing] = await db
        .select()
        .from(userCompanies)
        .where(
          and(
            eq(userCompanies.userId, userId),
            eq(userCompanies.companyId, companyId)
          )
        );

      if (!existing) {
        await db
          .insert(userCompanies)
          .values({ userId, companyId });
      }
    } catch (error) {
      console.error('Error adding user to company:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to add user to company: ${error.message}`);
      }
      throw new Error('Failed to add user to company: Unknown error occurred');
    }
  }

  async isUserInCompany(userId: number, companyId: number): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(userCompanies)
      .where(
        and(
          eq(userCompanies.userId, userId),
          eq(userCompanies.companyId, companyId)
        )
      );
    return !!membership;
  }

  async getForkliftsByUserId(userId: number): Promise<Forklift[]> {
    // Get all companies where the user is a member
    const userCompanyRows = await db
      .select({
        companyId: userCompanies.companyId,
      })
      .from(userCompanies)
      .where(eq(userCompanies.userId, userId));

    const companyIds = userCompanyRows.map(r => r.companyId);

    // If user is not in any companies, return an empty list
    if (companyIds.length === 0) {
      return [];
    }

    // Get all forklifts from companies where the user is a member
    return db
      .select()
      .from(forklifts)
      .where(inArray(forklifts.companyId, companyIds))
      .execute();
  }

  async getForklift(id: number): Promise<Forklift | undefined> {
    const [forklift] = await db
      .select()
      .from(forklifts)
      .where(eq(forklifts.id, id));
    return forklift;
  }

  async createForklift(userId: number, data: InsertForklift): Promise<Forklift> {
    // First verify user is a member of the company
    const isMember = await this.isUserInCompany(userId, data.companyId);
    if (!isMember) {
      throw new Error('User is not a member of this company');
    }

    const [forklift] = await db
      .insert(forklifts)
      .values({ ...data, userId })
      .returning();

    return forklift;
  }

  async updateForklift(id: number, data: Partial<InsertForklift>): Promise<Forklift> {
    const forklift = await this.getForklift(id);
    if (!forklift) {
      throw new Error('Forklift not found');
    }

    // If changing company, verify user is a member of the new company
    if (data.companyId && data.companyId !== forklift.companyId) {
      const [membership] = await db
        .select()
        .from(userCompanies)
        .where(
          and(
            eq(userCompanies.userId, forklift.userId),
            eq(userCompanies.companyId, data.companyId)
          )
        );
      if (!membership) {
        throw new Error('User cannot move forklift to a company they are not a member of');
      }
    }

    const [updated] = await db
      .update(forklifts)
      .set(data)
      .where(eq(forklifts.id, id))
      .returning();

    return updated;
  }

  async deleteForklift(id: number): Promise<void> {
    await db.delete(forklifts).where(eq(forklifts.id, id));
  }

  async getCompanyUsers(companyId: number): Promise<CompanyUser[]> {
    const result = await db
      .select({
        userId: users.id,
        username: users.username,
        email: users.email,
        isAdmin: userCompanies.isAdmin,
        isBlocked: userCompanies.isBlocked,
        joinedAt: userCompanies.joinedAt,
      })
      .from(userCompanies)
      .innerJoin(users, eq(users.id, userCompanies.userId))
      .where(eq(userCompanies.companyId, companyId));

    return result;
  }

  async updateCompanyUser(companyId: number, update: UpdateCompanyUser): Promise<void> {
    await db
      .update(userCompanies)
      .set({
        isAdmin: update.isAdmin,
        isBlocked: update.isBlocked,
      })
      .where(
        and(
          eq(userCompanies.companyId, companyId),
          eq(userCompanies.userId, update.userId)
        )
      );
  }

  async isCompanyAdmin(userId: number, companyId: number): Promise<boolean> {
    try {
      console.log(`Checking admin status for user ${userId} in company ${companyId}`);

      // First check if user is the company creator
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId));

      if (company && company.createdBy === userId) {
        console.log(`User ${userId} is the creator of company ${companyId}`);
        return true;
      }

      // Then check user_companies table
      const [membership] = await db
        .select()
        .from(userCompanies)
        .where(
          and(
            eq(userCompanies.userId, userId),
            eq(userCompanies.companyId, companyId)
          )
        );

      const isAdmin = membership?.isAdmin ?? false;
      console.log(`User ${userId} admin status in company ${companyId}: ${isAdmin}`);
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async regenerateCompanyJoinCode(companyId: number): Promise<string> {
    const newJoinCode = generateJoinCode();
    await db
      .update(companies)
      .set({ joinCode: newJoinCode })
      .where(eq(companies.id, companyId));

    return newJoinCode;
  }

  async deleteCompany(companyId: number): Promise<void> {
    // Delete all related records first
    await db.delete(userCompanies).where(eq(userCompanies.companyId, companyId));
    await db.delete(forklifts).where(eq(forklifts.companyId, companyId));
    // Finally delete the company
    await db.delete(companies).where(eq(companies.id, companyId));
  }
}

export const storage = new DatabaseStorage();