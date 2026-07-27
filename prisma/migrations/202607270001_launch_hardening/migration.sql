ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'QUOTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

CREATE TYPE "FilePurpose" AS ENUM ('AVATAR', 'RESOURCE_IMAGE', 'ORDER_SCREENSHOT', 'PAYMENT_SCREENSHOT', 'PAYMENT_QR');
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'OWNER_ADMIN');
CREATE TYPE "StoredObjectStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'DELETED');

ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Resource"
  ADD COLUMN "imageFileId" TEXT,
  ADD COLUMN "leadTimeDays" INTEGER;

ALTER TABLE "Order"
  ADD COLUMN "resourceTitle" TEXT,
  ADD COLUMN "resourcePrice" DECIMAL(12,2),
  ADD COLUMN "quoteNote" TEXT,
  ADD COLUMN "quotedAt" TIMESTAMPTZ(3),
  ADD COLUMN "acceptedAt" TIMESTAMPTZ(3),
  ADD COLUMN "screenshotFileId" TEXT;

UPDATE "Order" o
SET
  "resourceTitle" = r."title",
  "resourcePrice" = r."price"
FROM "Resource" r
WHERE o."resourceId" = r."id";

ALTER TABLE "VerificationCode"
  ADD COLUMN "codeHash" TEXT,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "usedAt" TIMESTAMPTZ(3);
-- Invalidate all pre-migration plaintext codes instead of copying them into the hash column.
UPDATE "VerificationCode"
SET "codeHash" = repeat('0', 64), "used" = true, "usedAt" = "createdAt";
ALTER TABLE "VerificationCode" ALTER COLUMN "codeHash" SET NOT NULL;
DROP INDEX IF EXISTS "VerificationCode_target_code_idx";
ALTER TABLE "VerificationCode" DROP COLUMN "code";
CREATE INDEX "VerificationCode_target_type_createdAt_idx" ON "VerificationCode"("target", "type", "createdAt");

CREATE TABLE "StoredObject" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "ownerId" TEXT,
  "purpose" "FilePurpose" NOT NULL,
  "visibility" "FileVisibility" NOT NULL,
  "status" "StoredObjectStatus" NOT NULL DEFAULT 'PENDING',
  "contentType" TEXT NOT NULL,
  "size" BIGINT NOT NULL,
  "checksum" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  CONSTRAINT "StoredObject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredObject_key_key" ON "StoredObject"("key");
CREATE INDEX "StoredObject_ownerId_status_idx" ON "StoredObject"("ownerId", "status");
CREATE INDEX "StoredObject_purpose_status_idx" ON "StoredObject"("purpose", "status");
CREATE INDEX "StoredObject_createdAt_idx" ON "StoredObject"("createdAt");
ALTER TABLE "StoredObject" ADD CONSTRAINT "StoredObject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StorageUsageMonth" (
  "id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "writeOps" INTEGER NOT NULL DEFAULT 0,
  "readOps" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "StorageUsageMonth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StorageUsageMonth_month_scope_key" ON "StorageUsageMonth"("month", "scope");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "reason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
