import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import * as userModel from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or Create User
      const user = await userModel.upsertUser({
        github_id: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value || null,
        avatar_url: profile.photos?.[0]?.value || null
      });
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

export default passport;