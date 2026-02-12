-- AlterTable
ALTER TABLE "court_actions" ALTER COLUMN "orderFileUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "witnesses" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contact" TEXT,
ALTER COLUMN "statementFileUrl" DROP NOT NULL;
