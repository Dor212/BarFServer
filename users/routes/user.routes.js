import { Router } from "express";
import User from "../models/User.schema.js";
import {
  addUser,
  deleteUser,
  login,
  getUserById,
} from "../services/userDataAccess.service.js";
import { validation } from "../../middlewares/validation.js";
import LoginSchema from "../validations/LoginSchema.js";
import RegisterSchema from "../validations/RegisterSchema.js";
import { generateToken } from "../../services/authService.js";
import { auth } from "../../middlewares/token.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import nodemailer from "nodemailer";
import { createMulterForClientDocuments } from "../../middlewares/upload.js";
import fs from "fs";
import path from "path";
import archiver from "archiver";

const router = Router();
const uploadClientDocs = createMulterForClientDocuments();

const MAIL_TO = process.env.LEADS_RECEIVER_EMAIL || "barflyshker@gmail.com";

function createMailTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_EMAIL_PASSWORD,
    },
  });
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function logMailEnv(label) {
  console.log(`[${label}] MAIL ENV`, {
    MY_EMAIL_EXISTS: !!process.env.MY_EMAIL,
    MY_EMAIL_PASSWORD_EXISTS: !!process.env.MY_EMAIL_PASSWORD,
    MAIL_TO,
  });
}

function logMailError(label, error) {
  console.error(`[${label}] MAIL ERROR FULL:`, error);
  console.error(`[${label}] MAIL ERROR MESSAGE:`, error?.message);
  console.error(`[${label}] MAIL ERROR CODE:`, error?.code);
  console.error(`[${label}] MAIL ERROR COMMAND:`, error?.command);
  console.error(`[${label}] MAIL ERROR RESPONSE:`, error?.response);
}

router.post("/register", validation(RegisterSchema), async (req, res) => {
  try {
    const data = req.body;
    const newUser = await addUser(data);
    return res.json({ message: "User Created", newUser });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

router.post("/login", validation(LoginSchema), async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    const user = await login(email, password);
    const token = generateToken(user);

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

    res.cookie("sid", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".barflyshker.com",
      path: "/",
      maxAge,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Login error:", err.message);

    if (
      err.message === "User not found" ||
      err.message === "Password is incorrect."
    ) {
      return res.status(401).json({ error: "Invalid email or password" });
    } else if (err.message.includes("Your account is temporarily locked")) {
      return res.status(403).json({ error: err.message });
    }

    return res
      .status(500)
      .json({ error: "An unexpected error occurred during login." });
  }
});

router.get("/", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    return res.json(users);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

router.post("/contact", async (req, res) => {
  const name = normalizeText(req.body.name);
  const email = normalizeText(req.body.email);
  const message = normalizeText(req.body.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    logMailEnv("CONTACT");
    console.log("[CONTACT] BODY:", { name, email, message });

    const transporter = createMailTransporter();
    await transporter.verify();

    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: MAIL_TO,
      subject: `New contact message | ${name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">
          <h2>פנייה חדשה מהאתר</h2>
          <p><strong>שם:</strong> ${name}</p>
          <p><strong>אימייל:</strong> ${email}</p>
          <p><strong>הודעה:</strong> ${message}</p>
        </div>
      `,
    });

    return res.json({ ok: true, message: "Contact email sent successfully" });
  } catch (error) {
    logMailError("CONTACT", error);
    return res.status(500).json({
      error: "Failed to send contact email",
      details: error?.message || "Unknown mail error",
      code: error?.code || null,
    });
  }
});

router.post("/landing-contact", async (req, res) => {
  const fullName = normalizeText(req.body.fullName);
  const phone = normalizeText(req.body.phone);
  const email = normalizeText(req.body.email);
  const incomeRange = normalizeText(req.body.incomeRange);
  const financialState = normalizeText(req.body.financialState);
  const hasLiabilities = normalizeText(req.body.hasLiabilities);
  const hadBankIssues = normalizeText(req.body.hadBankIssues);
  const bestTime = normalizeText(req.body.bestTime);

  if (
    !fullName ||
    !phone ||
    !email ||
    !incomeRange ||
    !financialState ||
    !hasLiabilities ||
    !hadBankIssues ||
    !bestTime
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    logMailEnv("LANDING");
    console.log("[LANDING] BODY:", {
      fullName,
      phone,
      email,
      incomeRange,
      financialState,
      hasLiabilities,
      hadBankIssues,
      bestTime,
    });

    const transporter = createMailTransporter();
    await transporter.verify();

    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: MAIL_TO,
      subject: `ליד חדש מדף הנחיתה | ${fullName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0f172a;">
          <h2 style="margin-bottom: 16px;">ליד חדש מדף הנחיתה</h2>
          <p><strong>שם מלא:</strong> ${fullName}</p>
          <p><strong>טלפון:</strong> ${phone}</p>
          <p><strong>אימייל:</strong> ${email}</p>
          <hr style="margin: 20px 0;" />
          <p><strong>טווח הכנסה חודשי:</strong> ${incomeRange}</p>
          <p><strong>מצב כלכלי נוכחי:</strong> ${financialState}</p>
          <p><strong>הלוואות / התחייבויות משמעותיות:</strong> ${hasLiabilities}</p>
          <p><strong>בעיות מול בנקים / גופים פיננסיים:</strong> ${hadBankIssues}</p>
          <p><strong>זמן נוח לשיחה:</strong> ${bestTime}</p>
        </div>
      `,
    });

    return res.json({ ok: true, message: "Landing lead sent successfully" });
  } catch (error) {
    logMailError("LANDING", error);
    return res.status(500).json({
      error: "Failed to send landing lead",
      details: error?.message || "Unknown mail error",
      code: error?.code || null,
    });
  }
});

router.post("/guide-contact", async (req, res) => {
  const fullName = normalizeText(req.body.fullName);
  const phone = normalizeText(req.body.phone);
  const email = normalizeText(req.body.email);

  if (!fullName || !phone || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    logMailEnv("GUIDE");
    console.log("[GUIDE] BODY:", {
      fullName,
      phone,
      email,
    });

    const transporter = createMailTransporter();
    await transporter.verify();

    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: MAIL_TO,
      subject: `ליד חדש מהמדריך | ${fullName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0f172a;">
          <h2 style="margin-bottom: 16px;">ליד חדש מדף המדריך</h2>
          <p><strong>שם מלא:</strong> ${fullName}</p>
          <p><strong>טלפון:</strong> ${phone}</p>
          <p><strong>אימייל:</strong> ${email}</p>
        </div>
      `,
    });

    return res.json({ ok: true, message: "Guide lead sent successfully" });
  } catch (error) {
    logMailError("GUIDE", error);
    return res.status(500).json({
      error: "Failed to send guide lead",
      details: error?.message || "Unknown mail error",
      code: error?.code || null,
    });
  }
});

router.post(
  "/documents/upload",
  uploadClientDocs.array("files"),
  (req, res) => {
    try {
      const uploadedFiles = req.files.map((file) => ({
        filename: file.filename,
        path: file.path,
      }));

      res.json({
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  },
);

router.delete("/documents/:clientName", (req, res) => {
  const { clientName } = req.params;

  const folderPath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "documents",
    clientName,
  );

  fs.rm(folderPath, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error("❌ Error deleting folder:", err);
      return res.status(500).json({ error: "Failed to delete folder" });
    }

    res.json({ message: "Folder deleted successfully" });
  });
});

router.get("/documents/:clientName/zip", async (req, res) => {
  try {
    const { clientName } = req.params;

    const folderPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "documents",
      clientName,
    );

    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${clientName}.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);
    archive.directory(folderPath, false);
    await archive.finalize();
  } catch (err) {
    console.error("ZIP error:", err);
    res.status(500).json({ error: "Failed to create zip" });
  }
});

router.get("/list", (req, res) => {
  try {
    const baseDir = path.join(process.cwd(), "public", "uploads", "documents");

    if (!fs.existsSync(baseDir)) {
      return res.json([]);
    }

    const folders = fs
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    const result = folders.map((clientName) => {
      const clientFolderPath = path.join(baseDir, clientName);
      const files = fs
        .readdirSync(clientFolderPath, { withFileTypes: true })
        .filter((dirent) => dirent.isFile())
        .map((dirent) => {
          const filePath = path.join(clientFolderPath, dirent.name);
          const stat = fs.statSync(filePath);

          return {
            filename: dirent.name,
            path: `/uploads/documents/${clientName}/${dirent.name}`,
            uploadedAt: stat.birthtime,
          };
        });

      return { clientName, files };
    });

    console.log("📦 JSON response:", JSON.stringify(result, null, 2));
    res.json(result);
  } catch (err) {
    console.error("🚨 Error listing documents:", err);
    res.status(500).json({ error: "Could not list client documents" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("sid", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain:
      process.env.NODE_ENV === "production" ? ".barflyshker.com" : undefined,
    path: "/",
  });

  return res.status(200).json({ ok: true });
});

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    return res.send("User Delete");
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

export default router;
