-- CreateTable
CREATE TABLE "AiMemory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT,
    "fingerprint" TEXT NOT NULL,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiMemory_user_id_fingerprint_key" ON "AiMemory"("user_id", "fingerprint");

-- CreateIndex
CREATE INDEX "AiMemory_user_id_idx" ON "AiMemory"("user_id");

-- CreateIndex
CREATE INDEX "AiMemory_kind_idx" ON "AiMemory"("kind");
