import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret_key";

export const verifyToken = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Missing or malformed Authorization token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SECRET_KEY);

      req.user = decoded; // Attach decoded user data to request

      // ✅ Role-based access control
      if (
        allowedRoles.length > 0 &&
        (!decoded.role || !allowedRoles.includes(decoded.role))
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: You do not have access to this resource" });
      }

      next(); // ✅ Token and role are valid — continue
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  };
};
