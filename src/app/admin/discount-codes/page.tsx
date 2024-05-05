import { PageHeader } from "../_components/PageHeader";
import Link from "next/link";
import db from "@/db/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Globe,
  Infinity,
  Minus,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  formatDateTime,
  formatDiscountCode,
  formatNumber,
} from "@/lib/formatter";
import {
  ActivateToggleDropDown,
  DeleteDropdownItem,
} from "./_components/discountCodeActions";

const WHERE_EXPIRED: Prisma.DiscountCodeWhereInput = {
  OR: [
    { limit: { not: null, lte: db.discountCode.fields.uses } },
    { expiresAt: { not: null, lte: new Date() } },
  ],
};

const SELECT_FIELDS: Prisma.DiscountCodeSelect = {
  id: true,
  allProducts: true,
  code: true,
  discountAmount: true,
  discountType: true,
  expiresAt: true,
  limit: true,
  uses: true,
  isActive: true,
  products: { select: { name: true } },
  _count: { select: { orders: true } },
};

function getExpiredDiscountCode() {
  return db.discountCode.findMany({
    select: SELECT_FIELDS,
    where: WHERE_EXPIRED,
    orderBy: {
      createdAt: "asc",
    },
  });
}

function getUnexpiredDiscountCode() {
  return db.discountCode.findMany({
    select: SELECT_FIELDS,
    where: { NOT: WHERE_EXPIRED },
    orderBy: {
      createdAt: "asc",
    },
  });
}

function getAllDiscountCodes() {
  return db.discountCode.findMany({
    select: SELECT_FIELDS,
    orderBy: {
      createdAt: "asc",
    },
  });
}

export default async function DiscountCodesPage() {
  const [expiredDiscountCodes, unExpiredDiscountCodes, allCodes] =
    await Promise.all([
      getExpiredDiscountCode(),
      getUnexpiredDiscountCode(),
      getAllDiscountCodes(),
    ]);

  return (
    <>
      <div className='flex justify-between items-center gap-4'>
        <PageHeader>Coupons</PageHeader>
        <Button asChild>
          <Link href='/admin/discount-codes/new'>Add Coupons</Link>
        </Button>
      </div>

      <DiscountCodeTable
        discountCodes={unExpiredDiscountCodes}
        canDeactive
      />

      <div className='pt-5'>
        <PageHeader>Expired Coupons</PageHeader>
        <DiscountCodeTable
          discountCodes={expiredDiscountCodes}
          isInactive
        />
      </div>
    </>
  );
}

type DiscountCodeProps = {
  discountCodes: Awaited<ReturnType<typeof getUnexpiredDiscountCode>>;
  isInactive?: boolean;
  canDeactive?: boolean;
};

async function DiscountCodeTable({
  discountCodes,
  isInactive = false,
  canDeactive = false,
}: DiscountCodeProps) {
  console.log(discountCodes);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='w-0'>
            <span className='sr-only'>Is Active</span>
          </TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Remaining Uses</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Products</TableHead>
          <TableHead className='w-0'>
            <span className='sr-only'>Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {discountCodes.map((discountCode) => (
          <TableRow key={discountCode.id}>
            <TableCell>
              {discountCode.isActive && !isInactive ? (
                <>
                  <span className='sr-only'>Active</span>
                  <CheckCircle2 />
                </>
              ) : (
                <>
                  <span className='sr-only'>Inactive</span>
                  <XCircle className='stroke-destructive' />
                </>
              )}
            </TableCell>
            <TableCell>{discountCode.code}</TableCell>
            <TableCell>{formatDiscountCode(discountCode)}</TableCell>
            <TableCell>
              {discountCode.expiresAt == null ? (
                <Minus />
              ) : (
                formatDateTime(discountCode.expiresAt)
              )}
            </TableCell>
            <TableCell>
              {discountCode.limit == null ? (
                <Infinity />
              ) : (
                formatNumber(discountCode.limit - discountCode.uses)
              )}
            </TableCell>
            <TableCell>{formatNumber(discountCode._count.orders)}</TableCell>
            <TableCell>
              {discountCode.allProducts ? (
                <Globe />
              ) : (
                discountCode.products.map((p) => p.name).join(",")
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreVertical />
                  <span className='sr-only'>Actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {canDeactive && (
                    <>
                      <ActivateToggleDropDown
                        id={discountCode.id}
                        isActive={discountCode.isActive}
                      />
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DeleteDropdownItem
                    disabled={discountCode._count.orders > 0}
                    id={discountCode.id}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
