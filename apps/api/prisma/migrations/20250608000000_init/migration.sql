CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "certificate_id" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "document_hash" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certificates_certificate_id_key" ON "certificates"("certificate_id");
