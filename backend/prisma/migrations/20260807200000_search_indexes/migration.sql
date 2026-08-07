-- AlterTable
CREATE INDEX `doctors_specialty_id_idx` ON `doctors`(`specialty_id`);

-- AlterTable
CREATE INDEX `establishments_city_id_idx` ON `establishments`(`city_id`);

-- AlterTable
CREATE INDEX `establishments_type_idx` ON `establishments`(`type`);
