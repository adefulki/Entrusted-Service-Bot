import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@entrusted/database";
import { notifyNewOffer } from "@/lib/discord-notify";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { listingId, offerPrice, message } = body;

    if (!listingId || !offerPrice) {
      return NextResponse.json(
        { error: "listingId and offerPrice are required" },
        { status: 400 }
      );
    }

    // Validate listing exists and is open
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "OPEN") {
      return NextResponse.json(
        { error: "Listing is not open for offers" },
        { status: 400 }
      );
    }

    if (listing.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot offer on your own listing" },
        { status: 400 }
      );
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        listingId,
        offererId: session.user.id,
        offerPrice: parseFloat(offerPrice),
        message: message || null,
      },
      include: {
        offerer: true,
        listing: { include: { owner: true } },
      },
    });

    // Trigger Discord Bot notification
    await notifyNewOffer({
      offerId: offer.id,
      listingId: listing.id,
      itemName: listing.itemName,
      listingType: listing.type,
      initialPrice: listing.initialPrice,
      offerPrice: offer.offerPrice,
      offerMessage: offer.message,
      ownerDiscordId: listing.owner.discordId,
      ownerUsername: listing.owner.username,
      offererUsername: offer.offerer.username,
    });

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    console.error("[API/offers] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    const where = listingId ? { listingId } : { offererId: session.user.id };

    const offers = await prisma.offer.findMany({
      where,
      include: {
        offerer: { select: { id: true, username: true, avatar: true } },
        listing: { select: { id: true, itemName: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("[API/offers] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
