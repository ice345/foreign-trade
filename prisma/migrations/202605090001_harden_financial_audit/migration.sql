-- Add soft-delete and financial audit fields for production readiness.
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

ALTER TABLE "User"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "deletedAt" TIMESTAMPTZ(3),
ADD COLUMN "deletedReason" TEXT;

CREATE INDEX "User_status_idx" ON "User"("status");

ALTER TABLE "Order"
ADD COLUMN "cancelledAt" TIMESTAMPTZ(3),
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "cancelledById" TEXT;

ALTER TABLE "Transaction"
ADD COLUMN "beforeBalance" DECIMAL(12,2),
ADD COLUMN "afterBalance" DECIMAL(12,2),
ADD COLUMN "paymentRequestId" TEXT,
ADD COLUMN "referenceNo" TEXT,
ADD COLUMN "adminId" TEXT;

CREATE INDEX "Transaction_paymentRequestId_idx" ON "Transaction"("paymentRequestId");
CREATE INDEX "Transaction_referenceNo_idx" ON "Transaction"("referenceNo");

ALTER TABLE "PaymentRequest"
ADD COLUMN "reviewedAt" TIMESTAMPTZ(3),
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "reviewNote" TEXT;

CREATE INDEX "PaymentRequest_reviewedById_idx" ON "PaymentRequest"("reviewedById");

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_paymentRequestId_fkey"
FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "RateLimitEntry" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMPTZ(3) NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("key")
);
