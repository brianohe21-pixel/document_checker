CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'REVOKED');

ALTER TABLE "certificates" ADD COLUMN "student_email" TEXT;
ALTER TABLE "certificates" ADD COLUMN "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "certificates" ADD COLUMN "revoked_at" TIMESTAMP(3);
ALTER TABLE "certificates" ADD COLUMN "revoked_reason" TEXT;
ALTER TABLE "certificates" ADD COLUMN "revoke_transaction_hash" TEXT;
