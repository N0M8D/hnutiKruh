/*
  Warnings:

  - You are about to alter the column `VariabilniSymbol` on the `Donation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - A unique constraint covering the columns `[VariabilniSymbol]` on the table `Donation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Donation` ADD COLUMN `bankRef` VARCHAR(191) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentStatus` ENUM('PENDING', 'PAID', 'UNDERPAID', 'OVERPAID', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    MODIFY `VariabilniSymbol` VARCHAR(10) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Donation_VariabilniSymbol_key` ON `Donation`(`VariabilniSymbol`);
