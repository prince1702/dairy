-- AlterTable
ALTER TABLE "Route" ADD COLUMN "subAdminId" TEXT;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_subAdminId_fkey" FOREIGN KEY ("subAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
