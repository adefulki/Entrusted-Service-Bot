/**
 * Sends offer notification to the Discord Bot via internal HTTP API.
 * The Bot service exposes a REST endpoint for the web app to trigger notifications.
 */

interface NotifyOfferPayload {
  offerId: string;
  listingId: string;
  itemName: string;
  listingType: string;
  initialPrice: number;
  offerPrice: number;
  offerMessage: string | null;
  ownerDiscordId: string;
  ownerUsername: string;
  offererUsername: string;
}

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:4000";

export async function notifyNewOffer(payload: NotifyOfferPayload) {
  try {
    const response = await fetch(`${BOT_API_URL}/api/notify/offer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_INTERNAL_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Discord Notify] Failed:", response.status, errorText);
    }

    return response.ok;
  } catch (error) {
    console.error("[Discord Notify] Error:", error);
    return false;
  }
}
