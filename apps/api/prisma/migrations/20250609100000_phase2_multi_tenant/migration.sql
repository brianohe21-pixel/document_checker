CREATE TYPE "MembershipRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'ISSUER', 'VIEWER');
CREATE TYPE "BulkJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "BulkJobItemStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');

CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "verify_base_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships"("user_id", "organization_id");
CREATE INDEX "memberships_organization_id_idx" ON "memberships"("organization_id");

CREATE TABLE "certificate_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "certificate_templates_organization_id_idx" ON "certificate_templates"("organization_id");

INSERT INTO "organizations" ("id", "name", "slug", "is_active", "created_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', true, CURRENT_TIMESTAMP);

ALTER TABLE "certificates" ADD COLUMN "organization_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "template_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "issued_by_user_id" UUID;

UPDATE "certificates" SET "organization_id" = '00000000-0000-0000-0000-000000000001';

ALTER TABLE "certificates" ALTER COLUMN "organization_id" SET NOT NULL;

CREATE INDEX "certificates_organization_id_created_at_idx" ON "certificates"("organization_id", "created_at");

CREATE TABLE "bulk_jobs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "status" "BulkJobStatus" NOT NULL DEFAULT 'PENDING',
    "total_rows" INTEGER NOT NULL,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "file_name" TEXT,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "bulk_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bulk_jobs_organization_id_status_idx" ON "bulk_jobs"("organization_id", "status");

CREATE TABLE "bulk_job_items" (
    "id" UUID NOT NULL,
    "bulk_job_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "BulkJobItemStatus" NOT NULL DEFAULT 'PENDING',
    "certificate_id" TEXT,
    "error" TEXT,
    CONSTRAINT "bulk_job_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bulk_job_items_bulk_job_id_idx" ON "bulk_job_items"("bulk_job_id");

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bulk_job_items" ADD CONSTRAINT "bulk_job_items_bulk_job_id_fkey" FOREIGN KEY ("bulk_job_id") REFERENCES "bulk_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "certificate_templates" ("id", "organization_id", "name", "config", "is_default", "version", "created_at", "updated_at")
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Default Template',
    '{"title":"CERTIFICATE OF COMPLETION","subtitle":"This certifies that","bodyLines":["has successfully completed"],"primaryColor":"#1a4d99","showQr":true,"showCertificateId":true}',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
