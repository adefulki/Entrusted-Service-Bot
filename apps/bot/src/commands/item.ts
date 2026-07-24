import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { prisma } from "@entrusted/database";

export const itemCommand = {
  data: new SlashCommandBuilder()
    .setName("item")
    .setDescription("Manage your marketplace listings")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new listing")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Listing type")
            .setRequired(true)
            .addChoices(
              { name: "Want to Sell", value: "WTS" },
              { name: "Want to Buy", value: "WTB" }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Item name")
            .setRequired(true)
        )
        .addNumberOption((opt) =>
          opt
            .setName("price")
            .setDescription("Price in Rupiah")
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("Item quantity (default: 1)")
            .setRequired(false)
            .setMinValue(1)
        )
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("Item description")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("image")
            .setDescription("Image URL")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List your active listings")
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Edit one of your listings")
        .addStringOption((opt) =>
          opt
            .setName("id")
            .setDescription("Listing ID")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("New item name")
            .setRequired(false)
        )
        .addNumberOption((opt) =>
          opt
            .setName("price")
            .setDescription("New price in Rupiah")
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("New quantity")
            .setRequired(false)
            .setMinValue(1)
        )
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("New description")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("image")
            .setDescription("New image URL")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete one of your listings")
        .addStringOption((opt) =>
          opt
            .setName("id")
            .setDescription("Listing ID")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "create":
        return handleCreate(interaction);
      case "list":
        return handleList(interaction);
      case "edit":
        return handleEdit(interaction);
      case "delete":
        return handleDelete(interaction);
    }
  },
};

async function getOrCreateUser(discordId: string, username: string) {
  return prisma.user.upsert({
    where: { discordId },
    update: { username },
    create: { discordId, username },
  });
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const type = interaction.options.getString("type", true) as "WTS" | "WTB";
  const itemName = interaction.options.getString("name", true);
  const price = interaction.options.getNumber("price", true);
  const quantity = interaction.options.getInteger("quantity") || 1;
  const description = interaction.options.getString("description");
  const imageUrl = interaction.options.getString("image");

  const user = await getOrCreateUser(
    interaction.user.id,
    interaction.user.username
  );

  const listing = await prisma.listing.create({
    data: {
      ownerId: user.id,
      type,
      itemName,
      quantity,
      initialPrice: price,
      description,
      imageUrl,
    },
  });

  const embed = new EmbedBuilder()
    .setTitle("✅ Listing Created!")
    .setColor(type === "WTS" ? 0x00ff88 : 0x0088ff)
    .addFields(
      { name: "Type", value: type, inline: true },
      { name: "Item", value: itemName, inline: true },
      { name: "Qty", value: quantity.toString(), inline: true },
      { name: "Price", value: `Rp ${price.toLocaleString("id-ID")}`, inline: true }
    )
    .setFooter({ text: `ID: ${listing.id}` })
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }
  if (imageUrl) {
    embed.setThumbnail(imageUrl);
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleList(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  if (!user) {
    return interaction.editReply("You don't have any listings yet.");
  }

  const listings = await prisma.listing.findMany({
    where: { ownerId: user.id, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { offers: true } } },
  });

  if (listings.length === 0) {
    return interaction.editReply("📭 You don't have any active listings.");
  }

  const embed = new EmbedBuilder()
    .setTitle("📦 Your Listings")
    .setColor(0x5865f2)
    .setDescription(
      listings
        .map(
          (l, i) =>
            `**${i + 1}.** \`${l.type}\` **${l.itemName}** (x${l.quantity})\n` +
            `   💰 Rp ${l.initialPrice.toLocaleString("id-ID")} • ` +
            `📨 ${l._count.offers} offers • ` +
            `📋 ${l.status}\n` +
            `   \`ID: ${l.id}\``
        )
        .join("\n\n")
    )
    .setFooter({ text: `${listings.length} listing(s)` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleEdit(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const listingId = interaction.options.getString("id", true);
  const newName = interaction.options.getString("name");
  const newPrice = interaction.options.getNumber("price");
  const newQuantity = interaction.options.getInteger("quantity");
  const newDescription = interaction.options.getString("description");
  const newImage = interaction.options.getString("image");

  // Verify ownership
  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  if (!user) {
    return interaction.editReply("❌ You don't have any listings.");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    return interaction.editReply("❌ Listing not found.");
  }

  if (listing.ownerId !== user.id) {
    return interaction.editReply("❌ You can only edit your own listings.");
  }

  if (listing.status !== "OPEN") {
    return interaction.editReply("❌ Can only edit listings with OPEN status.");
  }

  // Build update data
  const updateData: any = {};
  if (newName) updateData.itemName = newName;
  if (newPrice) updateData.initialPrice = newPrice;
  if (newQuantity) updateData.quantity = newQuantity;
  if (newDescription) updateData.description = newDescription;
  if (newImage) updateData.imageUrl = newImage;

  if (Object.keys(updateData).length === 0) {
    return interaction.editReply("⚠️ No changes provided.");
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
  });

  const embed = new EmbedBuilder()
    .setTitle("✏️ Listing Updated!")
    .setColor(0xffd700)
    .addFields(
      { name: "Item", value: updated.itemName, inline: true },
      { name: "Price", value: `Rp ${updated.initialPrice.toLocaleString("id-ID")}`, inline: true },
      { name: "Status", value: updated.status, inline: true }
    )
    .setFooter({ text: `ID: ${updated.id}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleDelete(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const listingId = interaction.options.getString("id", true);

  // Verify ownership
  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  if (!user) {
    return interaction.editReply("❌ You don't have any listings.");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { _count: { select: { transactions: true } } },
  });

  if (!listing) {
    return interaction.editReply("❌ Listing not found.");
  }

  if (listing.ownerId !== user.id) {
    return interaction.editReply("❌ You can only delete your own listings.");
  }

  if (listing._count.transactions > 0) {
    return interaction.editReply(
      "❌ Cannot delete a listing with active transactions. Please close it instead."
    );
  }

  // Delete associated offers first, then the listing
  await prisma.offer.deleteMany({
    where: { listingId },
  });

  await prisma.listing.delete({
    where: { id: listingId },
  });

  await interaction.editReply(
    `🗑️ Listing **${listing.itemName}** has been deleted.`
  );
}
