"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

interface Listing {
  id: string;
  type: "WTS" | "WTB";
  itemName: string;
  initialPrice: number;
  description: string | null;
  status: string;
  createdAt: string;
  owner: { id: string; username: string; avatar: string | null };
  offers: Array<{
    id: string;
    offerPrice: number;
    status: string;
    offerer: { username: string };
    createdAt: string;
  }>;
}

export default function ListingDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  async function fetchListing() {
    const res = await fetch(`/api/listings/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setListing(data.listing);
    }
    setLoading(false);
  }

  async function handleOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerPrice) return;
    setSubmitting(true);

    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: params.id,
        offerPrice,
        message: offerMessage || undefined,
      }),
    });

    if (res.ok) {
      setOfferPrice("");
      setOfferMessage("");
      fetchListing();
      alert("Offer submitted! The owner has been notified on Discord.");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to submit offer");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Listing not found.</p>
      </div>
    );
  }

  const isOwner = session?.user?.id === listing.owner.id;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Back to marketplace
        </button>

        {/* Listing Info */}
        <div className="rounded-xl border bg-card p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                listing.type === "WTS"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {listing.type}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded ${
                listing.status === "OPEN"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {listing.status}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-2">{listing.itemName}</h1>
          <p className="text-3xl font-bold text-primary mb-4">
            Rp {listing.initialPrice.toLocaleString("id-ID")}
          </p>
          {listing.description && (
            <p className="text-muted-foreground">{listing.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Posted by <strong>{listing.owner.username}</strong> •{" "}
            {new Date(listing.createdAt).toLocaleDateString("id-ID")}
          </p>
        </div>

        {/* Offer Form */}
        {session && !isOwner && listing.status === "OPEN" && (
          <div className="rounded-xl border bg-card p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">Make an Offer</h2>
            <form onSubmit={handleOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Offer Price (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  required
                  placeholder="Enter your offer price"
                  className="w-full px-4 py-2 bg-input border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={2}
                  placeholder="Any message for the owner..."
                  className="w-full px-4 py-2 bg-input border rounded-lg resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Offer"}
              </button>
            </form>
          </div>
        )}

        {/* Existing Offers */}
        {listing.offers && listing.offers.length > 0 && (
          <div className="rounded-xl border bg-card p-8">
            <h2 className="text-xl font-semibold mb-4">
              Offers ({listing.offers.length})
            </h2>
            <div className="space-y-3">
              {listing.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      Rp {offer.offerPrice.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      by {offer.offerer.username}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      offer.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : offer.status === "ACCEPTED"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
