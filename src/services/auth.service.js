import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateTokens = (user) => {
  const payload = { id: user.id, role: user.role, is_active: user.is_active };
  
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "3m" });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "5m" });
  
  return { accessToken, refreshToken };
};

export const verifyPKCE = (codeVerifier, codeChallenge) => {
  const hash = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  return hash === codeChallenge;
};