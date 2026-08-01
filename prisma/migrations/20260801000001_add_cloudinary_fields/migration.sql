-- AlterTable: Add Cloudinary fields to Media
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "cloudinaryId" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "cloudinaryThumbId" TEXT;
