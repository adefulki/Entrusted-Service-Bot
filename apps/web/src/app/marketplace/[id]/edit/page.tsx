"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

export default function EditListingPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    initialPrice: "",
    quantity: "1",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  async function fetchListing() {
    const res = await fetch(`/api/listings/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      const listing = data.listing;

      if (listing.owner.id !== session?.user?.id) {
        router.push("/marketplace");
        return;
      }

      setForm({
        itemName: listing.itemName,
        initialPrice: listing.initialPrice.toString(),
        quantity: (listing.quantity || 1).toString(),
        description: listing.description || "",
        imageUrl: listing.imageUrl || "",
      });
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/listings/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: form.itemName,
        initialPrice: form.initialPrice,
        quantity: form.quantity,
        description: form.description,
        imageUrl: form.imageUrl,
      }),
    });

    if (res.ok) {
      router.push("/marketplace/my-listings");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update listing");
    }
    setSaving(false);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-8">Edit Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Item Name</label>
            <input
              type="text"
              required
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              className="w-full px-4 py-2 bg-input border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price (Rp)</label>
            <input
              type="number"
              required
              min="0"
              value={form.initialPrice}
              onChange={(e) => setForm({ ...form, initialPrice: e.target.value })}
              className="w-full px-4 py-2 bg-input border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-4 py-2 bg-input border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 bg-input border rounded-lg resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-input border rounded-lg"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-80 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
