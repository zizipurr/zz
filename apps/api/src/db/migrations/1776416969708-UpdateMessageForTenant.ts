import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessageForTenant1776416969708 implements MigrationInterface {
    name = 'UpdateMessageForTenant1776416969708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_4838cd4fc48a6ff2d4aa01aa646\``);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`tenantId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`targetUserId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`eventId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` CHANGE \`type\` \`type\` enum ('alert', 'dispatch', 'complete', 'system') NOT NULL DEFAULT 'system'`);
        await queryRunner.query(`ALTER TABLE \`messages\` CHANGE \`userId\` \`userId\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` CHANGE \`userId\` \`userId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` CHANGE \`type\` \`type\` enum ('alert', 'dispatch', 'system') NOT NULL DEFAULT 'system'`);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`eventId\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`targetUserId\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`tenantId\``);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_4838cd4fc48a6ff2d4aa01aa646\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
