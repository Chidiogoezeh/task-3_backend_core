import app from "./src/app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health Check: /api/profiles (Version 1 Required)`);
  console.log(`Server running on UTC: ${new Date().toISOString()}`);
});