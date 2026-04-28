import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  let token;

  // 1. Check Header (CLI)
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2. Check Cookies (Web Portal)
  else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ status: "error", message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // Includes id, role, is_active
    
    if (!req.user.is_active) {
      return res.status(403).json({ status: "error", message: "Account is disabled" });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Token expired or invalid" });
  }
};