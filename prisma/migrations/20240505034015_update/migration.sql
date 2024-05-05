-- CreateEnum
CREATE TYPE "DiscountCodeType" AS ENUM ('PERCENTAGE', 'FIXE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountCodeId" TEXT;

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "discountType" "DiscountCodeType" NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allProducts" BOOLEAN NOT NULL DEFAULT false,
    "limit" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DiscountCodeToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "_DiscountCodeToProduct_AB_unique" ON "_DiscountCodeToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscountCodeToProduct_B_index" ON "_DiscountCodeToProduct"("B");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscountCodeToProduct" ADD CONSTRAINT "_DiscountCodeToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscountCodeToProduct" ADD CONSTRAINT "_DiscountCodeToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
