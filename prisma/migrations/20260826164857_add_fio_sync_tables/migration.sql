/*
  Warnings:

  - Made the column `VariabilniSymbol` on table `Donation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Donation` MODIFY `VariabilniSymbol` VARCHAR(10) NOT NULL;

-- CreateTable
CREATE TABLE `FioAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(64) NOT NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `lastFioId` BIGINT NULL,

    UNIQUE INDEX `FioAccount_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FioTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fioTransactionId` BIGINT NOT NULL,
    `accountId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'CZK',
    `counterAccount` VARCHAR(191) NULL,
    `counterBankCode` VARCHAR(10) NULL,
    `counterBankName` VARCHAR(191) NULL,
    `counterName` VARCHAR(191) NULL,
    `variableSymbol` VARCHAR(20) NULL,
    `constantSymbol` VARCHAR(20) NULL,
    `specificSymbol` VARCHAR(20) NULL,
    `userIdentification` VARCHAR(191) NULL,
    `message` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `comment` VARCHAR(191) NULL,
    `raw` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FioTransaction_accountId_date_idx`(`accountId`, `date`),
    UNIQUE INDEX `FioTransaction_accountId_fioTransactionId_key`(`accountId`, `fioTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FioTransaction` ADD CONSTRAINT `FioTransaction_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `FioAccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
