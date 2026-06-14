-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "suspended_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleDriveConnection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "google_email" TEXT,
    "encrypted_refresh_token" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleDriveConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleDriveSettings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sheet_mode" TEXT NOT NULL DEFAULT 'workspace',
    "image_folder_mode" TEXT NOT NULL DEFAULT 'workspace',
    "selected_spreadsheet_id" TEXT,
    "selected_spreadsheet_name" TEXT,
    "selected_folder_id" TEXT,
    "selected_folder_name" TEXT,
    "root_folder_id" TEXT,
    "workspace_folder_id" TEXT,
    "workspace_sheet_id" TEXT,
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleDriveSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'amazon',
    "country" TEXT NOT NULL DEFAULT 'US',
    "status" TEXT NOT NULL DEFAULT 'active',
    "agent_id" TEXT NOT NULL DEFAULT 'ali',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_name" TEXT,
    "title" TEXT,
    "bullets" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "raw_markdown" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "uploaded_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rule_text" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "duplicate_of_id" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "policy_status" TEXT,
    "overall_score" INTEGER NOT NULL DEFAULT 0,
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "seo_score" INTEGER NOT NULL DEFAULT 0,
    "conversion_score" INTEGER NOT NULL DEFAULT 0,
    "compliance_score" INTEGER NOT NULL DEFAULT 0,
    "accuracy_score" INTEGER NOT NULL DEFAULT 0,
    "hallucination_risk" INTEGER NOT NULL DEFAULT 0,
    "generated_images" INTEGER NOT NULL DEFAULT 0,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowJob" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT '[]',
    "result" TEXT,
    "error" TEXT,
    "credit_id" TEXT,
    "charged" BOOLEAN NOT NULL DEFAULT false,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveConnection_user_id_key" ON "GoogleDriveConnection"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveSettings_organization_id_key" ON "GoogleDriveSettings"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organization_id_user_id_key" ON "OrganizationMember"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organization_id_key" ON "Subscription"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Credit_organization_id_key" ON "Credit"("organization_id");

-- CreateIndex
CREATE INDEX "PolicyRule_category_idx" ON "PolicyRule"("category");

-- CreateIndex
CREATE INDEX "PolicyRule_status_idx" ON "PolicyRule"("status");

-- CreateIndex
CREATE INDEX "PolicyRule_fingerprint_idx" ON "PolicyRule"("fingerprint");

-- CreateIndex
CREATE INDEX "WorkflowRun_createdAt_idx" ON "WorkflowRun"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_status_idx" ON "WorkflowRun"("status");

-- CreateIndex
CREATE INDEX "WorkflowJob_user_id_idx" ON "WorkflowJob"("user_id");

-- CreateIndex
CREATE INDEX "WorkflowJob_status_idx" ON "WorkflowJob"("status");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleDriveConnection" ADD CONSTRAINT "GoogleDriveConnection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleDriveSettings" ADD CONSTRAINT "GoogleDriveSettings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyRule" ADD CONSTRAINT "PolicyRule_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "PolicyDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

