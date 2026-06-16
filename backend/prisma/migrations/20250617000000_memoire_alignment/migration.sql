-- Memoire alignment migration
ALTER TABLE `patients` ADD COLUMN `age` INTEGER NULL;
ALTER TABLE `patients` ADD COLUMN `gender` VARCHAR(191) NULL;

ALTER TABLE `establishments` ADD COLUMN `parent_establishment_id` VARCHAR(191) NULL;
ALTER TABLE `establishments` ADD CONSTRAINT `establishments_parent_establishment_id_fkey` FOREIGN KEY (`parent_establishment_id`) REFERENCES `establishments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `appointments` ADD COLUMN `assistant_id` VARCHAR(191) NULL;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_assistant_id_fkey` FOREIGN KEY (`assistant_id`) REFERENCES `assistants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `receiver_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `messages_sender_id_receiver_id_idx`(`sender_id`, `receiver_id`),
    INDEX `messages_receiver_id_is_read_idx`(`receiver_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
