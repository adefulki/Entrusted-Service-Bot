import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@entrusted/database";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const transactions = await prisma.transaction.findMany({
    include: {
      listing: true,
      buyer: { select: { id: true, username: true, discordId: true } },
      seller: { select: { id: true, username: true, discordId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ transactions });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { transactionId, status } = await req.json();

  const validStatuses = [
    "PENDING_PAYMENT",
    "PAID",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
  ];

  if (!transactionId || !status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status },
  });

  // If completed or cancelled, close the listing
  if (status === "COMPLETED" || status === "CANCELLED") {
    await prisma.listing.update({
      where: { id: transaction.listingId },
      data: { status: "CLOSED" },
    });
  }

  return NextResponse.json({ success: true, transaction });
}
