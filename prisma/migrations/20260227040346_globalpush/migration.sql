-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "finalPrice" DOUBLE PRECISION,
ADD COLUMN     "postLink" TEXT,
ADD COLUMN     "productLink" TEXT,
ADD COLUMN     "screenshotUrl" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "followers" INTEGER;
