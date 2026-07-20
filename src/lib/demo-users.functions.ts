import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/, "Need a letter").regex(/\d/, "Need a number"),
  dob: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const createDemoUser = createServerFn({ method: "POST" })
  .inputValidator((data) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    const { insertUser, hashPassword } = await import("./demo-users.server");
    const rec = await insertUser({
      email: data.email,
      name: data.name,
      passwordHash: hashPassword(data.password),
      dob: data.dob ?? null,
      country: data.country ?? null,
    });
    return { id: rec._id, email: rec.email, name: rec.name };
  });

export const verifyDemoUser = createServerFn({ method: "POST" })
  .inputValidator((data) => signInSchema.parse(data))
  .handler(async ({ data }) => {
    const { findByEmail, verifyPassword } = await import("./demo-users.server");
    const rec = await findByEmail(data.email);
    if (!rec) return null;
    if (!verifyPassword(data.password, rec.passwordHash)) return null;
    return { id: rec._id, email: rec.email, name: rec.name };
  });
