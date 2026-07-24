import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@entrusted/database";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalListings,
    activeListings,
    totalTransactions,
    pendingTransactions,
    completedTransactions,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "OPEN" } }),
    prisma.transaction.count(),
    prisma.transaction.count({
      where: { status: { in: ["PENDING_PAYMENT", "PAID", "DELIVERED"] } },
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { totalAmount: true },
    }),
  ]);

  const totalRevenue = completedTransactions.reduce(
    (sum, t) => sum + t.totalAmount,
    0
  );

  // Expenses could come from WTB transactions completed by admin
  // For now, simplified as 0 — can be extended with an Expense model
  const totalExpenses = 0;

  return NextResponse.json({
    totalListings,
    activeListings,
    totalTransactions,
    pendingTransactions,
    totalRevenue,
    totalExpenses,
  });
}
