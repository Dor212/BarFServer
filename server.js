import express from "express";
import router from "./router/router.js";
import chalk from "chalk";
import { morganLogger } from "./middlewares/morganLogger.js";
import { badPathHandler } from "./middlewares/badPathHandler.js";
import { ErrorHandler } from "./middlewares/errorHandler.js";
import { conn } from "./services/db.services.js";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import multer from "multer";

// ✅ הגדרת __dirname עבור ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ קונפיגורציה ל־multer עם שמירה לסיומת מקורית
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/uploads/documents"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});


dotenv.config();

// ✅ יצירת האפליקציה
const app = express();
const { SERVER } = process.env;
const PORT = process.env.PORT || 8080;

// ✅ הגדרות כלליות
app.use(
  cors({
    origin: ["https://www.barflyshker.com", "https://barflyshker.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(morganLogger);

// ✅ הגשת קבצים סטטיים מה-public
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));


// ✅ טעינת הראוטרים
app.use(router);

// ✅ בדיקת תקשורת עם הלקוח
app.get("/api/test", (req, res) => {
  res.json({ message: "החיבור בין השרת ללקוח עובד!" });
});

// ✅ ניהול שגיאות ונתיבים לא קיימים
app.use(badPathHandler);
app.use(ErrorHandler);

// ✅ הפעלת השרת
app.listen(PORT, async () => {
  console.log(chalk.blue(`🚀 Server is running on port ${PORT}`));
  await conn();
});
