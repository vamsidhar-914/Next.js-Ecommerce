"use client";

import { createPaymentIntent } from "@/actions/order";
import { userOrderExists } from "@/app/actions/order";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDiscountCodeAmount } from "@/lib/discountCodeHelper";
import { formatCurrency, formatDiscountCode } from "@/lib/formatter";
import { DiscountCodeType } from "@prisma/client";
import {
  AddressElement,
  CardElement,
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  StripeAddressElementOptions,
  StripeCardElement,
  StripeError,
  loadStripe,
} from "@stripe/stripe-js";
import { Router } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

type CheckoutProps = {
  product: {
    id: string;
    imagePath: string;
    name: string;
    priceInCents: number;
    description: string;
  };
  discountCode?: {
    id: string;
    discountAmount: number;
    discountType: DiscountCodeType;
  };
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
);

export function CheckoutForm({ product, discountCode }: CheckoutProps) {
  const amount =
    discountCode == null
      ? product.priceInCents
      : getDiscountCodeAmount(discountCode, product.priceInCents);

  const isDiscounted = amount !== product.priceInCents;

  return (
    <div className='max-w-5xl w-full mx-auto space-y-8'>
      <div className='flex gap-4 items-center'>
        <div className='aspect-video flex-shrink-0 w-1/3 relative'>
          <Image
            src={product.imagePath}
            fill
            alt={product.name}
            className='object-cover'
          />
        </div>
        <div>
          {/* <div className='text-lg flex gap-4 items-baseline'>
            
          </div> */}
          <div
            className={
              isDiscounted ? "line-through text-muted-foreground text-xs" : ""
            }
          >
            {formatCurrency(product.priceInCents / 100)}
          </div>
          {isDiscounted && (
            <div className='text-lg'>{formatCurrency(amount / 100)}</div>
          )}
          <h1 className='text-2xl font-bold'>{product.name}</h1>
          <div className='line-clamp-3 text-muted-foreground'>
            {product.description}
          </div>
        </div>
      </div>
      <Elements
        options={{ amount, mode: "payment", currency: "usd" }}
        stripe={stripePromise}
      >
        <Form
          discountCode={discountCode}
          productId={product.id}
          priceInCents={amount}
        />
      </Elements>
    </div>
  );
}

function Form({
  priceInCents,
  discountCode,
  productId,
}: {
  priceInCents: number;
  productId: string;
  discountCode?: {
    id: string;
    discountAmount: number;
    discountType: DiscountCodeType;
  };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setisLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [email, setEmail] = useState<string>();
  const discontCodeRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const coupon = searchParams.get("coupon");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (stripe == null || elements == null || email == null) return;

    setisLoading(true);
    const formSubmit = await elements.submit();
    if (formSubmit.error != null) {
      setErrorMessage(formSubmit.error.message);
      setisLoading(false);
      return;
    }

    const paymentIntent = await createPaymentIntent(
      email,
      productId,
      discountCode?.id
    );
    if (paymentIntent.error != null) {
      setErrorMessage(paymentIntent.error);
      setisLoading(false);
      return;
    }

    stripe
      .confirmPayment({
        elements,
        clientSecret: paymentIntent.clientSecret,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/stripe/purchase-success`,
        },
      })
      .then(({ error }) => {
        if (
          error!.type === "card_error" ||
          error!.type === "validation_error"
        ) {
          setErrorMessage(error!.message);
        } else {
          setErrorMessage(error!.message);
        }
      })
      .finally(() => setisLoading(false));
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription className='text-destructive'>
            {errorMessage && <div>{errorMessage}</div>}
            {coupon != null && discountCode == null && (
              <div>Invalid discount code</div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <AddressElement options={{ mode: "shipping" }} />
          <div className='mt-4'>
            <LinkAuthenticationElement
              onChange={(e) => setEmail(e.value.email)}
            />
          </div>
          <div className='space-y-2 mt-4'>
            <Label htmlFor='discountCode'>Coupon</Label>
            <div className='flex gap-4 items-center'>
              <Input
                id='discountCode'
                type='text'
                name='discountCode'
                className='max-w-xs w-full'
                ref={discontCodeRef}
                defaultValue={coupon || ""}
              />

              <Button
                type='button'
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("coupon", discontCodeRef.current?.value || "");
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Apply
              </Button>
              {discountCode != null && (
                <div className='text-muted-foreground'>
                  {formatDiscountCode(discountCode)} discount
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className='w-full'
            size='lg'
            disabled={stripe == null || elements == null || isLoading}
          >
            {isLoading ? "Purchasing" : "Purchase"} -{" "}
            {formatCurrency(priceInCents / 100)}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
