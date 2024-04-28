"use client";

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
import { formatCurrency } from "@/lib/formatter";
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
import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";

type CheckoutProps = {
  product: {
    id: string;
    imagePath: string;
    name: string;
    priceInCents: number;
    description: string;
  };
  clientSecret: string;
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
);

export function CheckoutForm({ product, clientSecret }: CheckoutProps) {
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
          <div className='text-lg'>
            {formatCurrency(product.priceInCents / 100)}
          </div>
          <h1 className='text-2xl font-bold'>{product.name}</h1>
          <div className='line-clamp-3 text-muted-foreground'>
            {product.description}
          </div>
        </div>
      </div>
      <Elements
        options={{ clientSecret }}
        stripe={stripePromise}
      >
        <Form
          productId={product.id}
          priceInCents={product.priceInCents}
        />
      </Elements>
    </div>
  );
}

type AddressStateProps = {
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;
};

function Form({
  priceInCents,
  productId,
}: {
  priceInCents: number;
  productId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setisLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [email, setEmail] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (stripe == null || elements == null || email == null) return;

    setisLoading(true);

    // check for existing order
    const exists = await userOrderExists(email, productId);

    if (exists) {
      setErrorMessage(
        "You have already purchased this product,Try downloading it from my Orders page"
      );
    }

    stripe
      .confirmPayment({
        elements,
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
          {errorMessage && (
            <CardDescription className='text-destructive'>
              {errorMessage}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <AddressElement options={{ mode: "shipping" }} />
          <div className='mt-4'>
            <LinkAuthenticationElement
              onChange={(e) => setEmail(e.value.email)}
            />
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
