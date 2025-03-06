import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn").notNull().unique(),
  publishDate: text("publish_date").notNull(),
  available: boolean("available").notNull().default(true),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  membershipId: text("membership_id").notNull().unique(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  memberId: integer("member_id").notNull(),
  loanDate: timestamp("loan_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertBookSchema = createInsertSchema(books).pick({
  title: true,
  author: true,
  isbn: true,
  publishDate: true,
});

export const insertMemberSchema = createInsertSchema(members).pick({
  name: true,
  email: true,
  phone: true,
  membershipId: true,
});

export const insertLoanSchema = createInsertSchema(loans).pick({
  bookId: true,
  memberId: true,
  loanDate: true,
  dueDate: true,
});

export const updateLoanSchema = createInsertSchema(loans).pick({
  bookId: true,
  memberId: true,
  loanDate: true,
  dueDate: true,
  returnDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type UpdateLoan = z.infer<typeof updateLoanSchema>;

export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Loan = typeof loans.$inferSelect;