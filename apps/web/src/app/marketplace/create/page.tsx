"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CreateListingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to create a listing.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      type: formData.get("type"),
      itemName: formData.get("itemName"),
      initialPrice: formData.get("initialPrice"),
      description: formData.get("description"),
    };

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/marketplace");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to create listing");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              name="type"
              required
              className="w-full px-4 py-2 bg-input border rounded-lg"
            >
              <option value="WTS">Want to Sell (WTS)</option>
              <option value="WTB">Want to Buy (WTB)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Item Name</label>
            <input
              name="itemName"
              type="text"
              required
              placeholder="e.g., iPhone 15 Pro Max"
              className="w-full px-4 py-2 bg-input border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price (Rp)</label>
            <input
              name="initialPrice"
              type="number"
              required
              min="0"
              placeholder="15000000"
              className="w-full px-4 py-2 bg-input border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe the item condition, specifications, etc."
              className="w-full px-4 py-2 bg-input border rounded-lg resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
