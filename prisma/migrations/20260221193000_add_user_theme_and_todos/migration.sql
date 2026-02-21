-- AlterTable
ALTER TABLE "UserSettings"
ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'light',
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "defaultEventDuration" INTEGER NOT NULL DEFAULT 60;

-- CreateTable
CREATE TABLE "TodoList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3),
    "scheduleToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TodoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodoList_userId_sortOrder_idx" ON "TodoList"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "TodoItem_userId_completed_dueAt_idx" ON "TodoItem"("userId", "completed", "dueAt");

-- CreateIndex
CREATE INDEX "TodoItem_listId_createdAt_idx" ON "TodoItem"("listId", "createdAt");

-- AddForeignKey
ALTER TABLE "TodoList"
ADD CONSTRAINT "TodoList_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoItem"
ADD CONSTRAINT "TodoItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoItem"
ADD CONSTRAINT "TodoItem_listId_fkey"
FOREIGN KEY ("listId") REFERENCES "TodoList"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
