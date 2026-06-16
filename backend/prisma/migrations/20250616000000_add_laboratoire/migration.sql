-- AlterTable: add LABORATOIRE to establishment type enum
ALTER TABLE `establishments` MODIFY `type` ENUM('HOPITAL', 'CLINIQUE', 'CABINET', 'CENTRE_SANTE', 'LABORATOIRE') NOT NULL;
