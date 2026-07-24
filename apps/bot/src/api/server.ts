import express from "express";
import { Client } from "discord.js";
import { handleOfferNotification } from "./routes/notify-offer.js";

export function startApiServer(client: Client) {
  const app = express();
  const PORT = process.env.BOT_API_PORT || 4000;

  app.use(express.json());

  // Auth middleware for internal API
  app.use((req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token !== process.env.BOT_INTERNAL_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  });

  // Routes
  app.post("/api/notify/offer", (req, res) =>
    handleOfferNotification(req, res, client)
  );

  app.listen(PORT, () => {
    console.log(`[Bot API] Internal server running on port ${PORT}`);
  });
}
