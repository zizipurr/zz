import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantAndRoleFields1776318921589 implements MigrationInterface {
    name = 'AddTenantAndRoleFields1776318921589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`tenantId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`district\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`realName\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`jobNumber\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`status\` enum ('pending', 'active', 'disabled') NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE \`events\` ADD \`tenantId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`events\` ADD \`district\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`events\` ADD \`reporterId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('super_admin', 'tenant_admin', 'grid_supervisor', 'grid_staff', 'community_manager', 'community_staff', 'community_owner', 'emergency_commander', 'emergency_responder', 'traffic_manager', 'traffic_operator') NOT NULL DEFAULT 'grid_staff'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'staff', 'resident') NOT NULL DEFAULT 'admin'`);
        await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`reporterId\``);
        await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`district\``);
        await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`tenantId\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`jobNumber\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`realName\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`district\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`tenantId\``);
    }

}
