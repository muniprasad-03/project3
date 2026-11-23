import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "./utils/password.js";
await connectDB();
const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (
  !ADMIN_NAME ||
  !ADMIN_EMAIL ||
  !isValidPassword(ADMIN_PASSWORD)
)
  throw new Error(
    `Set ADMIN_NAME, ADMIN_EMAIL and an ADMIN_PASSWORD with at least ${MIN_PASSWORD_LENGTH} characters in .env`,
  );
const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (existing) {
  console.log("Admin already exists");
  process.exit(0);
}
await User.create({
  name: ADMIN_NAME,
  email: ADMIN_EMAIL,
  passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
  role: "admin",
});
console.log(`Admin created: ${ADMIN_EMAIL}`);
process.exit(0);
