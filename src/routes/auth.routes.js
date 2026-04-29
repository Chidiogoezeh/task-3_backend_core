import { Router } from "express";
import passport from "passport";
import * as controller from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/github", authLimiter, passport.authenticate("github"));
router.get("/github/callback", passport.authenticate("github", { session: false }), controller.handleCallback);
router.post("/refresh", controller.handleRefresh);
router.post("/logout", controller.logout);
router.post("/pkce-init", controller.initPKCE);

router.get("/whoami", protect, (req, res) => {
  res.json({ 
    status: "success", 
    user: {
      username: req.user.username,
      role: req.user.role,
      avatar_url: req.user.avatar_url
    } 
  });
});

export default router;