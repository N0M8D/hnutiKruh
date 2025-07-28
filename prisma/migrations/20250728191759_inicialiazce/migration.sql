-- CreateTable
CREATE TABLE `Involvement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Jmeno` VARCHAR(191) NOT NULL,
    `Prijmeni` VARCHAR(191) NOT NULL,
    `Email` VARCHAR(191) NOT NULL,
    `Telefon` VARCHAR(191) NOT NULL,
    `newsletter` BOOLEAN NOT NULL,
    `gdprConsent` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
