import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import "dotenv/config";
import User, { IUser } from "./models/user";
import RefreshToken from "./models/refreshToken";
import PasswordResetToken from "./models/passwordResetToken";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev_secret";
const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 60);
const VERIFICATION_CODE_TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15);
const REQUIRE_VERIFIED_LOGIN = (process.env.REQUIRE_VERIFIED_EMAIL_FOR_LOGIN || "false") === "true";
const allowRoleOverride = (process.env.ALLOW_ROLE_FROM_REGISTER || "false") === "true";

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

type AuthedRequest = Request & { userId?: string; role?: "user" | "admin" | "hotel_owner" };
type SanitizableUser = Pick<IUser, "_id" | "email" | "firstName" | "lastName" | "role" | "loyaltyPoints" | "emailVerified">;

const millis = (days: number) => days * 24 * 60 * 60 * 1000;
const minutesToMillis = (minutes: number) => minutes * 60 * 1000;

const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(`[email] to=${to} subject="${subject}" body=${body}`);
};

const sanitizeUser = (user: SanitizableUser) => ({
  _id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  loyaltyPoints: user.loyaltyPoints,
  emailVerified: user.emailVerified,
});

const attachTokens = (user: SanitizableUser, tokens: { accessToken: string; refreshToken: string }) => ({
  ...sanitizeUser(user),
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  token: tokens.accessToken,
});

const createAccessToken = (user: IUser) => jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
const randomToken = () => crypto.randomBytes(48).toString("hex");
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

const issueTokens = async (user: IUser) => {
  const accessToken = createAccessToken(user);
  const refreshToken = randomToken();
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + millis(REFRESH_TOKEN_TTL_DAYS)),
  });
  return { accessToken, refreshToken };
};

const verifyToken = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;
  if (!token) return res.status(401).json({ message: "unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: "user" | "admin" | "hotel_owner" };
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: "invalid token" });
  }
};

const requireRole = (roles: Array<"user" | "admin" | "hotel_owner">) => (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.role || !roles.includes(req.role)) {
    return res.status(403).json({ message: "forbidden" });
  }
  next();
};

app.get("/health", (_req, res) => res.json({ status: "ok", service: "identity-service" }));

app.post(["/auth/register", "/users/register"], async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const requestedRole = allowRoleOverride ? ((req.body?.role as string) || undefined) : undefined;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already used" });
  const hashed = await bcrypt.hash(password, 10);
  const role = requestedRole && ["user", "admin", "hotel_owner"].includes(requestedRole) ? requestedRole : "user";
  const verificationCode = generateVerificationCode();
  const user = await User.create({
    email,
    password: hashed,
    firstName,
    lastName,
    role,
    verificationCode,
    verificationCodeExpiresAt: new Date(Date.now() + minutesToMillis(VERIFICATION_CODE_TTL_MINUTES)),
  });
  await sendEmail(email, "Verify your account", `Your verification code is ${verificationCode}`);
  const tokens = await issueTokens(user);
  res.json({
    ...attachTokens(user, tokens),
    message: "Registration successful. Please verify your email.",
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  if (REQUIRE_VERIFIED_LOGIN && !user.emailVerified) {
    return res.status(409).json({ message: "Email not verified" });
  }
  const tokens = await issueTokens(user);
  res.json(attachTokens(user, tokens));
});

app.get("/auth/validate-token", verifyToken, (_req, res) => res.json({ valid: true }));

app.post("/auth/logout", async (req, res) => {
  const refreshToken = req.body?.refreshToken as string | undefined;
  if (refreshToken) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  }
  res.json({ success: true });
});

app.post("/auth/refresh", async (req, res) => {
  const refreshToken = req.body?.refreshToken as string | undefined;
  if (!refreshToken) return res.status(400).json({ message: "refreshToken required" });
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    return res.status(401).json({ message: "refresh token invalid" });
  }
  const user = await User.findById(stored.userId);
  if (!user) {
    await stored.deleteOne();
    return res.status(401).json({ message: "refresh token invalid" });
  }
  await stored.deleteOne();
  const tokens = await issueTokens(user);
  res.json(attachTokens(user, tokens));
});

app.post("/auth/request-verification", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "user not found" });
  if (user.emailVerified) return res.json({ message: "already verified" });
  user.verificationCode = generateVerificationCode();
  user.verificationCodeExpiresAt = new Date(Date.now() + minutesToMillis(VERIFICATION_CODE_TTL_MINUTES));
  await user.save();
  await sendEmail(email, "Verify your account", `Your verification code is ${user.verificationCode}`);
  res.json({ message: "verification code sent" });
});

app.post("/auth/verify-email", async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ message: "email and code required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "user not found" });
  if (!user.verificationCode || user.verificationCode !== code) {
    return res.status(400).json({ message: "invalid code" });
  }
  if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "code expired" });
  }
  user.emailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  await user.save();
  res.json({ ...sanitizeUser(user) });
});

app.post("/auth/request-password-reset", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email required" });
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "If the account exists, a reset email was sent." });
  const token = randomToken();
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + minutesToMillis(PASSWORD_RESET_TOKEN_TTL_MINUTES)),
  });
  await sendEmail(email, "Password reset", `Use this token to reset your password: ${token}`);
  res.json({ message: "If the account exists, a reset email was sent." });
});

app.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: "token and password required" });
  const tokenHash = hashToken(token);
  const resetDoc = await PasswordResetToken.findOne({ tokenHash });
  if (!resetDoc || resetDoc.usedAt || resetDoc.expiresAt.getTime() <= Date.now()) {
    return res.status(400).json({ message: "invalid token" });
  }
  const user = await User.findById(resetDoc.userId);
  if (!user) {
    await resetDoc.deleteOne();
    return res.status(400).json({ message: "invalid token" });
  }
  user.password = await bcrypt.hash(password, 10);
  await user.save();
  resetDoc.usedAt = new Date();
  await resetDoc.save();
  await RefreshToken.deleteMany({ userId: user._id });
  res.json({ message: "password updated" });
});

app.get("/users/me", verifyToken, async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "not found" });
  res.json(sanitizeUser(user));
});

// Update profile (first/last name)
app.patch("/users/me", verifyToken, async (req: AuthedRequest, res: Response) => {
  const updates: any = {};
  if (typeof req.body?.firstName === 'string') updates.firstName = req.body.firstName;
  if (typeof req.body?.lastName === 'string') updates.lastName = req.body.lastName;
  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
  if (!user) return res.status(404).json({ message: "not found" });
  res.json(sanitizeUser(user));
});

// Add loyalty points to current user (demo)
app.post("/users/me/loyalty/add", verifyToken, async (req: AuthedRequest, res: Response) => {
  const points = Number(req.body?.points || 0);
  if (!Number.isFinite(points) || points <= 0) return res.status(400).json({ message: "points must be > 0" });
  const user = await User.findByIdAndUpdate(req.userId, { $inc: { loyaltyPoints: points } }, { new: true });
  if (!user) return res.status(404).json({ message: "not found" });
  res.json({ loyaltyPoints: user.loyaltyPoints });
});

// Admin endpoints
app.get("/admin/users", verifyToken, requireRole(["admin"]), async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => sanitizeUser(u as SanitizableUser)));
});

app.patch("/admin/users/:id/role", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { role } = req.body || {};
  if (!role || !["user", "admin", "hotel_owner"].includes(role)) {
    return res.status(400).json({ message: "invalid role" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: "not found" });
  res.json(sanitizeUser(user));
});

const port = process.env.PORT || 7102;
app.listen(port, () => console.log(`identity-service listening on :${port}`));
