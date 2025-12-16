import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import productService from "../service/product.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../dto/product.dto.js";

const productController = {
  /**
   * ✅ Create Product
   * Accepts optional file in req.file (multer). If present, saves file to
   * public/uploads/products/<uuid>.<ext> and stores product_image_url as
   * "/uploads/products/<uuid>.<ext>" in DB.
   */
  async create(req, res) {
    try {
      // parse fields with zod (req.body contains text fields from multipart/form-data)
      const productData = await parseZodSchema(createProductSchema, req.body);

      // If file present, save it to disk and set product_image_url to relative path
      if (req.file && req.file.buffer) {
        const uploadsDir = path.join(process.cwd(), "uploads", "products");
        // ensure dir exists
        fs.mkdirSync(uploadsDir, { recursive: true });

        // preserve original extension if available
        const ext = path.extname(req.file.originalname) || ".jpg";
        const filename = `${uuidv4()}${ext}`;
        const fullPath = path.join(uploadsDir, filename);

        // write file buffer
        await fs.promises.writeFile(fullPath, req.file.buffer);

        // store only the relative web path in DB (frontend will fetch from API_BASE + product_image_url)
        productData.product_image_url = `/uploads/products/${filename}`;
      }

      // Add audit info
      productData.created_by = req.user?.id;
      productData.created_by_name = req.user?.username;
      productData.created_by_email = req.user?.email;

      const product = await productService.create(productData, req.user);
      return res.sendSuccess(product, "Product created successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to create product");
    }
  },

  /**
   * ✅ Get All Products (with filters, pagination)
   */
  async getAll(req, res) {
    try {
      const products = await productService.getAll(req.query);
      return res.sendSuccess(products, "Products fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch products");
    }
  },

  /**
   * ✅ Bulk Upload Products
   */
  async bulkUpload(req, res) {
    try {
      if (!req.file) {
        return res.sendError("Please upload a file");
      }

      const result = await productService.bulkUpload(
        req.file.buffer,
        req.user
      );

      return res.sendSuccess(result, "Bulk upload completed");
    } catch (error) {
      return res.sendError(error.message || "Bulk upload failed");
    }
  },

  /**
   * ✅ Get Product by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getById(id);
      return res.sendSuccess(product, "Product fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch product");
    }
  },

  /**
   * ✅ Update Product
   * If req.file present, replace stored file and update product_image_url.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await parseZodSchema(updateProductSchema, req.body);

      // If file present, save it and set product_image_url
      if (req.file && req.file.buffer) {
        const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "products");
        fs.mkdirSync(uploadsDir, { recursive: true });

        const ext = path.extname(req.file.originalname) || ".jpg";
        const filename = `${uuidv4()}${ext}`;
        const fullPath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(fullPath, req.file.buffer);

        // set relative path
        data.product_image_url = `/uploads/products/${filename}`;
      }

      data.updated_by = req.user?.id;
      data.updated_by_name = req.user?.username;
      data.updated_by_email = req.user?.email;

      const updatedProduct = await productService.update(id, data, req.user);
      return res.sendSuccess(
        updatedProduct,
        "Product updated successfully"
      );
    } catch (error) {
      return res.sendError(error.message || "Failed to update product");
    }
  },

  /**
   * ✅ Soft Delete Product
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.delete(id, req.user);
      return res.sendSuccess(result, "Product deleted successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to delete product");
    }
  },

  /**
   * ✅ Restore Soft Deleted Product
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.restore(id, req.user);
      return res.sendSuccess(result, "Product restored successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to restore product");
    }
  },
};

export default productController;
