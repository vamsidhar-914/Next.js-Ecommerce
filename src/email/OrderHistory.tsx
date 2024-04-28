import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";
import { OrderInformation } from "./_componets/OrderInformation";
import React from "react";

type OrderHistoryProps = {
  orders: {
    id: string;
    pricePaidInCents: number;
    createdAt: Date;
    downloadVerificationid: string;
    product: {
      name: string;
      imagePath: string;
      description: string;
    };
  }[];
};

OrderHistoryEmail.PreviewProps = {
  orders: [
    {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      pricePaidInCents: 10000,
      downloadVerificationid: crypto.randomUUID(),
      product: {
        name: "Product name",
        description: "description",
        imagePath:
          "/products/f8a337ec-d2a2-4f48-ba51-19855b472fc0-Screenshot (8).png",
      },
    },
    {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      pricePaidInCents: 143000,
      downloadVerificationid: crypto.randomUUID(),
      product: {
        name: "Product nmae2",
        description: "description another",
        imagePath:
          "/products/ff899f53-535a-4c30-872a-edce40371f18-Screenshot (3).png",
      },
    },
  ],
} satisfies OrderHistoryProps;

export default function OrderHistoryEmail({ orders }: OrderHistoryProps) {
  return (
    <Html>
      <Preview>Order history & Downloads</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>Order History</Heading>
            {orders.map((order, index) => (
              <React.Fragment key={index}>
                <OrderInformation
                  order={order}
                  product={order.product}
                  downloadVerificationId={order.downloadVerificationid}
                />
                {index < orders.length - 1 && <Hr />}
              </React.Fragment>
            ))}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
