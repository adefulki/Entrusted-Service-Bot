"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Offer {
  id: string;
  offerPrice: number;
  message: string | null;
  status: string;
  createdAt: string;
  listing: { id: string; itemName: string; type: string };
  offerer: { id: string; username: string };
}

export default function MyOffersPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) fetchOffers();
  }, [session]);

  async function fetchOffers() {
    setLoading(true);
    const res = await fetch("/api/offers");
    const data = await res.json();
    setOffers(data.offers || []);
    setLoading(false);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to view your offers.</p>
          <a
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-[#5865F2] text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            Sign in with Discord
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Offers</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : offers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't made any offers yet.</p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between p-6 rounded-xl border bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        offer.listing.type === "WTS"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {offer.listing.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        offer.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : offer.status === "ACCEPTED"
                          ? "bg-green-500/20 text-green-400"
                          : offer.status === "REJECTED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {offer.status}
                    </span>
                  </div>
                  <Link
                    href={`/marketplace/${offer.listing.id}`}
                    className="text-lg font-semibold hover:text-primary transition"
                  >
                    {offer.listing.itemName}
                  </Link>
                  <p className="text-primary font-bold">
                    Your offer: Rp {offer.offerPrice.toLocaleString("id-ID")}
                  </p>
                  {offer.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      "{offer.message}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(offer.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
