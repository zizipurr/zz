import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserNickname1776309760706 implements MigrationInterface {
  name = 'AddUserNickname1776309760706'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`nickname\` varchar(255) NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`nickname\``)
  }
}
