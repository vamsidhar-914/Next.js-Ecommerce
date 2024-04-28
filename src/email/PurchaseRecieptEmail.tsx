import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";
import { OrderInformation } from "./_componets/OrderInformation";

type PurchaseRecieptProps = {
  product: {
    name: string;
    imagePath: string;
    description: string;
  };
  order: {
    id: string;
    createdAt: Date;
    pricePaidInCents: number;
  };
  downloadVerificationid: string;
};

PurchaseRecieptEmail.PreviewProps = {
  product: {
    name: "Product name",
    description: "description",
    imagePath:
      "/products/f8a337ec-d2a2-4f48-ba51-19855b472fc0-Screenshot (8).png",
  },
  order: {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    pricePaidInCents: 10000,
  },
  downloadVerificationid: crypto.randomUUID(),
} satisfies PurchaseRecieptProps;

export default function PurchaseRecieptEmail({
  product,
  order,
  downloadVerificationid,
}: PurchaseRecieptProps) {
  return (
    <Html>
      <Preview>Download {product.name} and view reciept </Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>Purchase reciept</Heading>
            <OrderInformation
              order={order}
              product={product}
              downloadVerificationId={downloadVerificationid}
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
