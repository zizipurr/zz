import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventLocationFields1776326257120 implements MigrationInterface {
    name = 'AddEventLocationFields1776326257120'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`events\` ADD \`street\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`events\` ADD \`lat\` decimal(10,6) NULL`);
        await queryRunner.query(`ALTER TABLE \`events\` ADD \`lng\` decimal(10,6) NULL`);
        await queryRunner.query(`ALTER TABLE \`events\` CHANGE \`location\` \`location\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`events\` CHANGE \`location\` \`location\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`lng\``);
        await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`lat\``);
        await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`street\``);
    }

}
