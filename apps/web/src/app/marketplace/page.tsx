"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Listing {
  id: string;
  type: "WTS" | "WTB";
  itemName: string;
  initialPrice: number;
  quantity: number;
  description: string | null;
  status: string;
  createdAt: string;
  owner: { id: string; username: string; avatar: string | null };
  _count: { offers: number };
}

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<"ALL" | "WTS" | "WTB">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [filter]);

  async function fetchListings() {
    setLoading(true);
    const params = filter !== "ALL" ? `?type=${filter}` : "";
    const res = await fetch(`/api/listings${params}`);
    const data = await res.json();
    setListings(data.listings || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <div className="flex gap-3">
            {session && (
              <>
                <Link
                  href="/marketplace/my-listings"
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90"
                >
                  My Listings
                </Link>
                <Link
                  href="/marketplace/my-offers"
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90"
                >
                  My Offers
                </Link>
                <Link
                  href="/marketplace/create"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
                >
                  + New Listing
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["ALL", "WTS", "WTB"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:opacity-80"
              }`}
            >
              {tab === "ALL" ? "All" : tab === "WTS" ? "Want to Sell" : "Want to Buy"}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <p className="text-muted-foreground">Loading listings...</p>
        ) : listings.length === 0 ? (
          <p className="text-muted-foreground">No listings found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="block p-6 rounded-xl border bg-card hover:border-primary/50 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      listing.type === "WTS"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {listing.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {listing._count.offers} offers
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1">{listing.itemName}</h3>
                <p className="text-2xl font-bold text-primary">
                  Rp {listing.initialPrice.toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Qty: {listing.quantity}
                </p>
                {listing.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {listing.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>by {listing.owner.username}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
