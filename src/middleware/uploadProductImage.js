// middleware/uploadToSpaces.js
import multer from "multer";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "../config/spaces.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // optional: 5 MB limit
});

/**
 * Middleware factory: returns [multer.single(field), uploaderMiddleware]
 * Usage: uploadToSpacesSingle('image') in your route.
 */
export const uploadToSpacesSingle = (fieldName = "image") => {
  // return array of middlewares so it can be used inline
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file) return next();

        // create a stable key
        const ext = path.extname(req.file.originalname) || ".jpg";
        const key = `products/${uuidv4()}${ext}`;

        // configure upload params
        const params = {
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype || "application/octet-stream",
          ACL: "public-read",
        };

        // lib-storage Upload handles multipart if needed
        const uploader = new Upload({
          client: s3Client,
          params,
        });

        await uploader.done();

        // attach useful info for controller
        req.file.key = key;
        req.file.location = `${process.env.DO_SPACES_CDN}/${key}`; // final CDN URL
        // originalname, mimetype, size already available on req.file

        return next();
      } catch (err) {
        return next(err);
      }
    },
  ];
};

export default uploadToSpacesSingle;
