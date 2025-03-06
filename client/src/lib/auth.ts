import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";

export async function login(username: string, password: string): Promise<User> {
  const res = await apiRequest("POST", "/api/login", { username, password });
  return res.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/logout");
}
