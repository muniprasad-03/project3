import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { hashToken } from "../utils/tokens.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
      return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active")
      return res.status(401).json({ message: "Account unavailable" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
}

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
