import db from "@/db/db";
import PurchaseRecieptEmail from "@/email/PurchaseRecieptEmail";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const resend = new Resend(process.env.RESEND_PRIVATE_KEY);

export async function POST(req: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  if (event.type === "charge.succeeded") {
    const charge = event.data.object;
    const productId = charge.metadata.productId;
    const discountCodeId = charge.metadata.discountCodeId;
    const email = charge.billing_details.email!;
    const pricePaidInCents = charge.amount;

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (product == null || email == null) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const userFields = {
      email,
      orders: { create: { productId, pricePaidInCents, discountCodeId } },
    };

    const {
      orders: [order],
    } = await db.user.upsert({
      where: { email },
      create: userFields,
      update: userFields,
      select: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (discountCodeId != null) {
      db.discountCode.update({
        where: { id: discountCodeId },
        data: {
          uses: { increment: 1 },
        },
      });
    }

    const downloadVerification = await db.downloadVerification.create({
      data: {
        productId,
        expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await resend.emails.send({
      from: `Support <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Order confirmation",
      react: (
        <PurchaseRecieptEmail
          order={order}
          product={product}
          downloadVerificationid={downloadVerification.id}
        />
      ),
    });
  }

  return new NextResponse();
}
