import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@entrusted/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // WTS or WTB
    const status = searchParams.get("status") || "OPEN";

    const listings = await prisma.listing.findMany({
      where: {
        ...(type && { type: type as any }),
        status: status as any,
      },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("[API/listings] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, itemName, initialPrice, description, imageUrl } = body;

    if (!type || !itemName || !initialPrice) {
      return NextResponse.json(
        { error: "type, itemName, and initialPrice are required" },
        { status: 400 }
      );
    }

    if (!["WTS", "WTB"].includes(type)) {
      return NextResponse.json(
        { error: "type must be WTS or WTB" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: session.user.id,
        type,
        itemName,
        initialPrice: parseFloat(initialPrice),
        description: description || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (error) {
    console.error("[API/listings] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
