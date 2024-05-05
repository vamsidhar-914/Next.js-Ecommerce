import db from "@/db/db";
import { PageHeader } from "../../_components/PageHeader";
import { DiscountCodeForm } from "../_components/DiscountCodeForm";

function getProductsforDiscount() {
  return db.product.findMany({
    select: {
      name: true,
      id: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export default async function Page() {
  const getProductsforDiscountCodes = await getProductsforDiscount();
  return (
    <>
      <PageHeader>Add coupon</PageHeader>
      <DiscountCodeForm products={getProductsforDiscountCodes} />
    </>
  );
}
