import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import Product from "../models/product.models.js";

const productService = {
  /**
   * ✅ Create product
   */
  async create(data, user) {
    try {
      const requiredFields = ["title", "price"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      const product = await Product.create({
        id: uuidv4(),
        product_image_url: data.product_image_url || null,
        title: data.title,
        price: data.price,
        description: data.description || null,
        is_active: true,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return product;
    } catch (error) {
      console.error("❌ Error creating product:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Bulk upload products (Excel / CSV)
   */
  async bulkUpload(fileBuffer, user) {
    try {
      if (!fileBuffer) throw new Error("File is required");

      let rows = [];

      // Detect Excel
      const isExcel =
        fileBuffer[0] === 0x50 &&
        fileBuffer[1] === 0x4b &&
        fileBuffer[2] === 0x03 &&
        fileBuffer[3] === 0x04;

      if (isExcel) {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      } else {
        rows = parse(fileBuffer.toString(), {
          columns: true,
          skip_empty_lines: true,
        });
      }

      const results = { success: [], failed: [] };

      for (const [index, row] of rows.entries()) {
        try {
          if (!row.title || !row.price)
            throw new Error("Missing title or price");

          const product = await Product.create({
            id: uuidv4(),
            title: row.title,
            price: row.price,
            description: row.description || null,
            product_image_url: row.product_image_url || null,
            created_by: user?.id || null,
            created_by_name: user?.username || null,
            created_by_email: user?.email || null,
          });

          results.success.push({
            row: index + 1,
            title: product.title,
            status: "Created",
          });
        } catch (err) {
          results.failed.push({
            row: index + 1,
            data: row,
            error: err.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("❌ Bulk upload error:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get all products (pagination, search, filter)
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      is_active,
      min_price,
      max_price,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (typeof is_active !== "undefined") where.is_active = is_active;

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = min_price;
      if (max_price) where.price[Op.lte] = max_price;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sort_by, sort_order]],
    });

    return {
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  },

  /**
   * ✅ Get product by ID
   */
  async getById(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");
    return product;
  },

  /**
   * ✅ Update product
   */
  async update(id, data, user) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    await product.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return product;
  },

  /**
   * ✅ Delete product (soft / hard)
   */
  async delete(id, user, hardDelete = false) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    if (hardDelete) {
      await product.destroy();
      return { message: "Product permanently deleted" };
    }

    await product.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Product deactivated successfully" };
  },

  /**
   * ✅ Restore product
   */
  async restore(id, user) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    await product.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Product reactivated successfully" };
  },
};

export default productService;
