-- CreateTable
CREATE TABLE `Donation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `Jmeno` VARCHAR(191) NOT NULL,
    `Prijmeni` VARCHAR(191) NOT NULL,
    `DatumNarozeni` DATETIME(3) NOT NULL,
    `StatniPrislusnost` VARCHAR(191) NOT NULL,
    `Ulice` VARCHAR(191) NOT NULL,
    `Obec` VARCHAR(191) NOT NULL,
    `PSC` VARCHAR(191) NOT NULL,
    `Stat` VARCHAR(191) NOT NULL,
    `Email` VARCHAR(191) NOT NULL,
    `Telefon` VARCHAR(191) NOT NULL,
    `Castka` DECIMAL(14, 2) NOT NULL,
    `VariabilniSymbol` VARCHAR(191) NULL,
    `Poznamka` VARCHAR(191) NULL,
    `ZapojitSe` BOOLEAN NOT NULL DEFAULT false,
    `Newsletter` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
