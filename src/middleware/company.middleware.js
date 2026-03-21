// middleware/company.middleware.js
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret_key";

export const attachCompany = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or malformed Authorization token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SECRET_KEY);

      // Attach decoded user info
      req.user = decoded;

      // ✅ Attach company_id separately for convenience
      req.company_id = decoded.company_id;

      // Optional: role-based access
      if (allowedRoles.length > 0 && (!decoded.role || !allowedRoles.includes(decoded.role))) {
        return res.status(403).json({ message: "Forbidden: You do not have access" });
      }

      next();
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  };
};