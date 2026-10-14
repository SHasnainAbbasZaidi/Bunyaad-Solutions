-- AlterTable
ALTER TABLE "services" ADD COLUMN "relatedProjectIds" TEXT;

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("active", "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt") SELECT "active", "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE TABLE "new_hero_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "headline" TEXT NOT NULL DEFAULT 'Building the Foundation of Digital Innovation.',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT 'We design, develop, and power digital platforms that connect businesses, empower consumers, and transform industries.',
    "ctaPrimaryText" TEXT NOT NULL DEFAULT 'Explore Our Solutions',
    "ctaPrimaryUrl" TEXT NOT NULL DEFAULT '/solutions',
    "ctaSecondaryText" TEXT NOT NULL DEFAULT 'Contact Us',
    "ctaSecondaryUrl" TEXT NOT NULL DEFAULT '/contact',
    "backgroundImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "visualSettings" TEXT NOT NULL DEFAULT 'center',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_hero_sections" ("backgroundImage", "createdAt", "ctaPrimaryText", "ctaPrimaryUrl", "ctaSecondaryText", "ctaSecondaryUrl", "description", "headline", "id", "published", "subtitle", "updatedAt", "version") SELECT "backgroundImage", "createdAt", "ctaPrimaryText", "ctaPrimaryUrl", "ctaSecondaryText", "ctaSecondaryUrl", "description", "headline", "id", "published", "subtitle", "updatedAt", "version" FROM "hero_sections";
DROP TABLE "hero_sections";
ALTER TABLE "new_hero_sections" RENAME TO "hero_sections";
CREATE TABLE "new_contact_inquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "subject" TEXT NOT NULL,
    "inquiryType" TEXT NOT NULL DEFAULT 'General',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "internalNotes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contact_inquiries_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_contact_inquiries" ("assignedToId", "company", "createdAt", "email", "fullName", "id", "inquiryType", "internalNotes", "message", "status", "subject", "updatedAt") SELECT "assignedToId", "company", "createdAt", "email", "fullName", "id", "inquiryType", "internalNotes", "message", "status", "subject", "updatedAt" FROM "contact_inquiries";
DROP TABLE "contact_inquiries";
ALTER TABLE "new_contact_inquiries" RENAME TO "contact_inquiries";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_tokenHash_key" ON "password_resets"("tokenHash");
