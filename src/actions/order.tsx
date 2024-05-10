"use server";

import db from "@/db/db";
import OrderHistoryEmail from "@/email/OrderHistory";
import {
  getDiscountCodeAmount,
  usableDiscountCode,
} from "@/lib/discountCodeHelper";
import { Resend } from "resend";
import Stripe from "stripe";
import { z } from "zod";

const emailSchema = z.string().email();
const resend = new Resend(process.env.RESEND_PRIVATE_KEY as string);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function emailOrderHistory(
  prevState: unknown,
  formData: FormData
): Promise<{ message?: string; error?: string }> {
  const result = emailSchema.safeParse(formData.get("email"));

  if (result.success === false) {
    return { error: "Invalid email addres " };
  }

  const user = await db.user.findUnique({
    where: { email: result.data },
    select: {
      email: true,
      orders: {
        select: {
          pricePaidInCents: true,
          id: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              imagePath: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (user == null) {
    return {
      message: "not able to fetch the data,can u enter correct emailId",
    };
  }

  const orders = user.orders.map(async (order) => {
    return {
      ...order,
      downloadVerificationid: (
        await db.downloadVerification.create({
          data: {
            expiredAt: new Date(Date.now() + 24 * 1000 * 60 * 60),
            productId: order.product.id,
          },
        })
      ).id,
    };
  });

  const data = await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: user.email,
    subject: "Order",
    react: <OrderHistoryEmail orders={await Promise.all(orders)} />,
  });

  if (data.error) {
    return {
      error: "There was an error sending to your email, please try again",
    };
  }

  return {
    message:
      "Check your email to view your order history and download your products",
  };
}

export async function createPaymentIntent(
  email: string,
  productId: string,
  discountCodeId?: string
) {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });
  if (product == null) return { error: "unexpected Error" };
  const discountCode =
    discountCodeId == null
      ? null
      : await db.discountCode.findUnique({
          where: {
            id: discountCodeId,
            ...usableDiscountCode(product.id),
          },
        });

  if (discountCode == null && discountCodeId != null) {
    return { error: "coupon has expired" };
  }
  const existingOrder = await db.order.findFirst({
    where: { user: { email }, productId },
    select: { id: true },
  });

  if (existingOrder != null) {
    return {
      error:
        "you have already purchased this product. try downloading it from the my orders page",
    };
  }

  const amount =
    discountCode == null
      ? product.priceInCents
      : getDiscountCodeAmount(discountCode, product.priceInCents);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "USD",
    description: "software development services",
    metadata: {
      productId: product.id,
      discountCodeId: discountCode?.id || null,
    },
  });

  if (paymentIntent.client_secret == null) {
    return { error: "unknown error occured" };
  }

  return { clientSecret: paymentIntent.client_secret };
}
