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
  const { state } = req.query;

  // The tokens are generated for the user Passport just authenticated
  const tokens = authService.generateTokens(req.user);

  // If there is a PKCE challenge in Redis for this state, it's a CLI login
  const isCli = await redisClient.get(`pkce_${state}`);

  if (isCli) {
    // Redirect CLI users back to their local server with the data
    const cliUrl = `http://localhost:4856/callback?code=${req.query.code}&state=${state}`;
    return res.redirect(cliUrl);
  }

  // Web Portal Flow: Set cookies and redirect to the web dashboard
  res.cookie("access_token", tokens.accessToken, { httpOnly: true, secure: true });
  return res.redirect(`${process.env.WEB_PORTAL_URL}/dashboard.html`);
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