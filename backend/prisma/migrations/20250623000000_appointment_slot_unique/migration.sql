-- Prevent double booking of the same doctor slot
CREATE UNIQUE INDEX `appointments_doctor_id_date_start_time_key` ON `appointments`(`doctor_id`, `date`, `start_time`);
