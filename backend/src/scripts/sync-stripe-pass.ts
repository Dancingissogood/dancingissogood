import { createDatabaseClient } from "@dancingissogood/db";

import { createStripeClient } from "../stripe.js";

const pass = {
  accessDays: 3,
  accessEnds: "1:00 PM",
  accessStarts: "9:00 AM",
  currency: "usd",
  description: "Three days of camp access, Monday through Wednesday, 9:00 AM to 1:00 PM.",
  name: "Three-Day Camp Pass",
  priceCents: 10_000,
  slug: "three-day-camp-pass",
} as const;

const database = createDatabaseClient();
const stripe = createStripeClient();

try {
  const existingPrices = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [pass.slug],
  });

  let stripePriceId: string;

  if (existingPrices.data[0]) {
    const existingPrice = existingPrices.data[0];

    if (
      existingPrice.currency !== pass.currency ||
      existingPrice.recurring !== null ||
      existingPrice.unit_amount !== pass.priceCents
    ) {
      throw new Error(`Existing Stripe price for ${pass.slug} does not match the pass configuration.`);
    }

    stripePriceId = existingPrice.id;
  } else {
    const product = await stripe.products.create({
      description: pass.description,
      metadata: { pass_product_slug: pass.slug },
      name: pass.name,
    });
    const price = await stripe.prices.create({
      currency: pass.currency,
      lookup_key: pass.slug,
      product: product.id,
      unit_amount: pass.priceCents,
    });

    stripePriceId = price.id;
  }

  await database.passProduct.upsert({
    create: { ...pass, stripePriceId },
    update: {
      ...pass,
      active: true,
      stripePriceId,
    },
    where: { slug: pass.slug },
  });

  console.log(`Synced ${pass.slug} to Stripe price ${stripePriceId}.`);
} finally {
  await database.$disconnect();
}
