import { users, books, members, loans } from "@shared/schema";
import type { InsertUser, User, InsertBook, Book, InsertMember, Member, InsertLoan, Loan } from "@shared/schema";
import type { UpdateLoan } from "./types"; // Assuming UpdateLoan is defined in a separate file

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Books
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book>;
  deleteBook(id: number): Promise<void>;

  // Members
  getMembers(): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;

  // Loans
  getLoans(): Promise<Loan[]>;
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, loan: Partial<UpdateLoan>): Promise<Loan>;
  getOverdueLoans(): Promise<Loan[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private members: Map<number, Member>;
  private loans: Map<number, Loan>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.members = new Map();
    this.loans = new Map();
    this.currentIds = { users: 1, books: 1, members: 1, loans: 1 };

    // Add default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "admin"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Books
  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentIds.books++;
    const book = { ...insertBook, id, available: true };
    this.books.set(id, book);
    return book;
  }

  async updateBook(id: number, updateBook: Partial<InsertBook>): Promise<Book> {
    const book = this.books.get(id);
    if (!book) throw new Error("Book not found");

    const updatedBook = { ...book, ...updateBook };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: number): Promise<void> {
    this.books.delete(id);
  }

  // Members
  async getMembers(): Promise<Member[]> {
    return Array.from(this.members.values());
  }

  async getMember(id: number): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = this.currentIds.members++;
    const member = { ...insertMember, id };
    this.members.set(id, member);
    return member;
  }

  async updateMember(id: number, updateMember: Partial<InsertMember>): Promise<Member> {
    const member = this.members.get(id);
    if (!member) throw new Error("Member not found");

    const updatedMember = { ...member, ...updateMember };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async deleteMember(id: number): Promise<void> {
    this.members.delete(id);
  }

  // Loans
  async getLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values());
  }

  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const id = this.currentIds.loans++;
    
    // Validate book exists and is available
    const book = this.books.get(insertLoan.bookId);
    if (!book) {
      throw new Error(`Book with ID ${insertLoan.bookId} not found`);
    }
    if (!book.available) {
      throw new Error(`Book with ID ${insertLoan.bookId} is not available for loan`);
    }
    
    // Validate member exists
    const member = this.members.get(insertLoan.memberId);
    if (!member) {
      throw new Error(`Member with ID ${insertLoan.memberId} not found`);
    }
    
    const loan = { ...insertLoan, id, returnDate: null };
    this.loans.set(id, loan);

    // Mark book as unavailable
    this.books.set(book.id, { ...book, available: false });

    return loan;
  }

  async updateLoan(id: number, updateLoan: Partial<UpdateLoan>): Promise<Loan> {
    const loan = this.loans.get(id);
    if (!loan) throw new Error("Loan not found");

    const updatedLoan = { ...loan, ...updateLoan };
    this.loans.set(id, updatedLoan);

    // If return date is set, mark book as available
    if (updateLoan.returnDate) {
      const book = this.books.get(loan.bookId);
      if (book) {
        this.books.set(book.id, { ...book, available: true });
      }
    }

    return updatedLoan;
  }

  async getOverdueLoans(): Promise<Loan[]> {
    const now = new Date();
    return Array.from(this.loans.values()).filter(
      loan => !loan.returnDate && new Date(loan.dueDate) < now
    );
  }
}

export const storage = new MemStorage();