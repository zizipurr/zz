import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776244440917 implements MigrationInterface {
    name = 'Migration1776244440917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`openid\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`openid\``);
    }

}
