"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Listing {
  id: string;
  type: "WTS" | "WTB";
  itemName: string;
  initialPrice: number;
  description: string | null;
  status: string;
  createdAt: string;
  _count: { offers: number };
}

export default function MyListingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) fetchMyListings();
  }, [session]);

  async function fetchMyListings() {
    setLoading(true);
    const res = await fetch("/api/listings?mine=true");
    const data = await res.json();
    setListings(data.listings || []);
    setLoading(false);
  }

  async function handleDelete(id: string, itemName: string) {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setListings(listings.filter((l) => l.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete listing");
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to manage your listings.</p>
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <Link
            href="/marketplace/create"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
          >
            + New Listing
          </Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You don't have any listings yet.</p>
            <Link
              href="/marketplace/create"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-6 rounded-xl border bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
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
                          : listing.status === "IN_TRANSACTION"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{listing.itemName}</h3>
                  <p className="text-primary font-bold">
                    Rp {listing.initialPrice.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {listing._count.offers} offers • Created{" "}
                    {new Date(listing.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/marketplace/${listing.id}/edit`}
                    className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:opacity-80"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(listing.id, listing.itemName)}
                    className="px-3 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:opacity-80"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
