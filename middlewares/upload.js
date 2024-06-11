import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("tmp"));
  },
  filename: function (req, file, cb) {
    const extName = path.extname(file.originalname);

    const baseName = path.basename(file.originalname, extName);

    const suffix = crypto.randomUUID();

    const newName = `${baseName}--${suffix}${extName}`;
    cb(null, newName);
  },
});

export default multer({ storage });
