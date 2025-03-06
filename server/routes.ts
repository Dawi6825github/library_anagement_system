import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookSchema, insertMemberSchema, insertLoanSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Session setup
  app.use(
    session({
      secret: "library-secret",
      resave: false,
      saveUninitialized: false,
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  // Books routes
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.post("/api/books", requireAuth, async (req, res) => {
    try {
      const book = insertBookSchema.parse(req.body);
      const created = await storage.createBook(book);
      res.json(created);
    } catch (err) {
      res.status(400).json({ message: "Invalid book data" });
    }
  });

  app.patch("/api/books/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.updateBook(id, req.body);
      res.json(book);
    } catch (err) {
      res.status(404).json({ message: "Book not found" });
    }
  });

  app.delete("/api/books/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBook(id);
      res.json({ message: "Book deleted" });
    } catch (err) {
      res.status(404).json({ message: "Book not found" });
    }
  });

  // Members routes
  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/members", requireAuth, async (req, res) => {
    try {
      const member = insertMemberSchema.parse(req.body);
      const created = await storage.createMember(member);
      res.json(created);
    } catch (err) {
      res.status(400).json({ message: "Invalid member data" });
    }
  });

  app.patch("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.updateMember(id, req.body);
      res.json(member);
    } catch (err) {
      res.status(404).json({ message: "Member not found" });
    }
  });

  app.delete("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMember(id);
      res.json({ message: "Member deleted" });
    } catch (err) {
      res.status(404).json({ message: "Member not found" });
    }
  });

  // Loans routes
  app.get("/api/loans", requireAuth, async (req, res) => {
    try {
      const loans = await storage.getLoans();
      res.json(loans);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post("/api/loans", requireAuth, async (req, res) => {
    try {
      const loan = insertLoanSchema.parse(req.body);
      const created = await storage.createLoan(loan);
      res.json(created);
    } catch (err) {
      res.status(400).json({ message: "Invalid loan data" });
    }
  });

  app.patch("/api/loans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loan = await storage.updateLoan(id, req.body);
      res.json(loan);
    } catch (err) {
      res.status(404).json({ message: "Loan not found" });
    }
  });

  app.get("/api/loans/overdue", requireAuth, async (req, res) => {
    try {
      const overdue = await storage.getOverdueLoans();
      res.json(overdue);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch overdue loans" });
    }
  });

  return httpServer;
}
