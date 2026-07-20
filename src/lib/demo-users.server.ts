// Server-only helpers for the local JSON-backed "users" store.
// Mirrors a MongoDB collection shape so you can swap this file for a real
// Mongo driver later without touching the rest of the app.
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type StoredUser = {
  _id: string;
  email: string;
  name: string;
  passwordHash: string; // "salt:hash" hex
  dob: string | null;
  country: string | null;
  createdAt: string;
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "users.json");

async function readAll(): Promise<{ users: StoredUser[] }> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw);
  } catch (e: any) {
    if (e?.code === "ENOENT") return { users: [] };
    throw e;
  }
}

async function writeAll(db: { users: StoredUser[] }) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2), "utf8");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function findByEmail(email: string): Promise<StoredUser | null> {
  const db = await readAll();
  return db.users.find((u) => u.email === email) ?? null;
}

export async function insertUser(u: Omit<StoredUser, "_id" | "createdAt">): Promise<StoredUser> {
  const db = await readAll();
  if (db.users.some((x) => x.email === u.email)) {
    throw new Error("An account with that email already exists");
  }
  const rec: StoredUser = {
    _id: randomBytes(12).toString("hex"),
    createdAt: new Date().toISOString(),
    ...u,
  };
  db.users.push(rec);
  await writeAll(db);
  return rec;
}
