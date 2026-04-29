import * as authService from "../services/auth.service.js";
import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";
import * as userModel from "../models/user.model.js";

export const handleRefresh = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ status: "error", message: "Refresh token required" });

  const isBlacklisted = await redisClient.get(`bl_${refresh_token}`);
  if (isBlacklisted) return res.status(401).json({ status: "error", message: "Token reuse detected" });

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    
    // Invalidate old refresh token immediately (Rotation)
    await redisClient.setEx(`bl_${refresh_token}`, 300, "true"); 

    const user = await userModel.findById(decoded.id);
    if (!user || !user.is_active) throw new Error();

    const tokens = authService.generateTokens(user);
    
    // Return both new tokens
    return res.status(200).json({ status: "success", ...tokens });
  } catch (err) {
    return res.status(401).json({ status: "error", message: "Invalid refresh token" });
  }
};

export const handleCallback = async (req, res) => {
  const { code, state, code_verifier } = req.query; 
  
  // 1. If code_verifier exists, it's a CLI PKCE flow
  if (code_verifier) {
    const storedChallenge = await redisClient.get(`pkce_${state}`);
    // If no challenge found in Redis, the session might have expired
    if (!storedChallenge) return res.status(400).json({ status: "error", message: "PKCE session expired" });
    
    const isValid = authService.verifyPKCE(code_verifier, storedChallenge);
    if (!isValid) return res.status(400).json({ status: "error", message: "PKCE verification failed" });
    await redisClient.del(`pkce_${state}`); 
  }

  // 2. Generate tokens for the user (Passport attached user to req.user)
  const tokens = authService.generateTokens(req.user);

  // 3. Set Cookie for Web Portal
  res.cookie("access_token", tokens.accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
  
  // 4. CLI Handling,If state contains a hint that it's from the CLI (e.g., you passed a port) or if code_verifier was present, redirect to the CLI's local listener.
  if (code_verifier) {
    const cliCallbackUrl = `http://localhost:4856/callback?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
    return res.redirect(cliCallbackUrl);
  }
  
  // 5. Return tokens in JSON for CLI to capture
  return res.status(200).json({ status: "success", ...tokens });
};

export const logout = async (req, res) => {
    res.clearCookie("access_token");
    return res.status(200).json({ status: "success", message: "Logged out" });
};