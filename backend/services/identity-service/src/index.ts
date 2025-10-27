import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "./models/user";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev_secret";
const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;

if (!MONGO_URI) {
  console.error("MONGODB_CONNECTION_STRING missing");
  process.exit(1);
}

const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("identity-service connected to MongoDB");
  } catch (e: any) {
    console.error("Mongo connect failed, retrying in 5s:", e?.message || e);
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();

// Middleware to verify JWT
const verifyToken = (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;
  if (!token) return res.status(401).json({ message: "unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "invalid token" });
  }
};

app.get("/health", (_req, res) => res.json({ status: "ok", service: "identity-service" }));

// Support both /auth/register and /users/register (frontend uses /api/users/register)
app.post(["/auth/register", "/users/register"], async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  // Optional role for onboarding owners/admins; defaults to 'user'.
  // Controlled by ALLOW_ROLE_FROM_REGISTER flag. Enabled by default unless NODE_ENV=production.
  const allowRoleOverride = (process.env.ALLOW_ROLE_FROM_REGISTER ?? (process.env.NODE_ENV === 'production' ? 'false' : 'true')) === 'true';
  const requestedRole = allowRoleOverride ? ((req.body?.role as string) || undefined) : undefined;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already used" });
  const hashed = await bcrypt.hash(password, 10);
  const role = requestedRole && ["user", "admin", "hotel_owner"].includes(requestedRole)
    ? requestedRole
    : "user";
  const user = await User.create({ email, password: hashed, firstName, lastName, role });
  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, userId: user._id, email: user.email, firstName, lastName, role: user.role });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, userId: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
});

app.get("/auth/validate-token", verifyToken, (_req, res) => res.json({ valid: true }));

// Stateless logout (client deletes token)
app.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

app.get("/users/me", verifyToken, async (req: Request & { userId?: string }, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "not found" });
  res.json({ _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
});

const port = process.env.PORT || 7102;
app.listen(port, () => console.log(`identity-service listening on :${port}`));
