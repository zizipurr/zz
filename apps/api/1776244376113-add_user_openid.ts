import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserOpenid1776244376113 implements MigrationInterface {
    name = 'AddUserOpenid1776244376113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`openid\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`openid\``);
    }

}
