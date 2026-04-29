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

  // 1. If code_verifier is missing, this is the INITIAL redirect from GitHub to your Backend
  // We need to send the user BACK to the CLI local server
  if (code && state && !code_verifier) {
    // The TRD specifies port 4856 for the CLI callback
    const cliLocalUrl = `http://localhost:4856/callback?code=${code}&state=${state}`;
    return res.redirect(cliLocalUrl);
  }
  
  // 2. If code_verifier exists, the CLI is now calling this endpoint to exchange the code
  if (code_verifier) {
    const storedChallenge = await redisClient.get(`pkce_${state}`);
    if (!storedChallenge) return res.status(400).json({ status: "error", message: "PKCE session expired" });
    
    const isValid = authService.verifyPKCE(code_verifier, storedChallenge);
    if (!isValid) return res.status(400).json({ status: "error", message: "PKCE verification failed" });
    await redisClient.del(`pkce_${state}`); 
  }

  // Generate tokens (Ensure passport handled the GitHub exchange before this point)
  const tokens = authService.generateTokens(req.user);

  // Set Cookie for Web Portal
  res.cookie("access_token", tokens.accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
  
  return res.status(200).json({ status: "success", ...tokens });
};

export const initPKCE = async (req, res) => {
  const { state, code_challenge } = req.body;
  // Store the challenge in Redis for 5 minutes
  await redisClient.setEx(`pkce_${state}`, 300, code_challenge);
  return res.status(200).json({ status: "success" });
};

export const logout = async (req, res) => {
    res.clearCookie("access_token");
    return res.status(200).json({ status: "success", message: "Logged out" });
};