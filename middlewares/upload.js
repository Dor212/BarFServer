import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createMulterForFolder = (folderName) => {
  const uploadDir = path.join(__dirname, `../public/uploads/${folderName}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + unique + ext);
    },
  });

  return multer({ storage });
};

export const createMulterForClientDocuments = () => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const clientName = req.query.name;
        if (!clientName) return cb(new Error("Missing client name"));
        const safeName = clientName.replace(/[^a-zA-Z0-9א-ת ]/g, "").trim();
        const uploadDir = path.join(
          __dirname,
          `../public/uploads/documents/${safeName}`
        );

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + unique + ext);
      },
    }),
  });
};
