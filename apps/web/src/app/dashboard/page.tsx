"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalTransactions: number;
  pendingTransactions: number;
  totalRevenue: number;
  totalExpenses: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchStats();
    }
  }, [session]);

  async function fetchStats() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to view the dashboard.</p>
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

  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard / POS</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Active Listings"
            value={stats?.activeListings ?? "-"}
          />
          <StatCard
            label="Total Transactions"
            value={stats?.totalTransactions ?? "-"}
          />
          <StatCard
            label="Pending Transactions"
            value={stats?.pendingTransactions ?? "-"}
            highlight
          />
          <StatCard
            label="Revenue (Income)"
            value={
              stats
                ? `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`
                : "-"
            }
            color="green"
          />
          <StatCard
            label="Expenses"
            value={
              stats
                ? `Rp ${stats.totalExpenses.toLocaleString("id-ID")}`
                : "-"
            }
            color="red"
          />
          <StatCard
            label="Net Profit"
            value={
              stats
                ? `Rp ${(stats.totalRevenue - stats.totalExpenses).toLocaleString("id-ID")}`
                : "-"
            }
            color="blue"
          />
        </div>

        {/* Transaction management section */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <p className="text-muted-foreground">
            Transaction verification and status management will be loaded here.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string | number;
  color?: "green" | "red" | "blue";
  highlight?: boolean;
}) {
  const colorClasses = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  return (
    <div
      className={`rounded-xl border bg-card p-6 ${
        highlight ? "border-yellow-500/50" : ""
      }`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          color ? colorClasses[color] : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
