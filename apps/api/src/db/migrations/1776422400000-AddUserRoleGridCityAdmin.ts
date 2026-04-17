import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserRoleGridCityAdmin1776422400000 implements MigrationInterface {
  name = 'AddUserRoleGridCityAdmin1776422400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('super_admin', 'tenant_admin', 'grid_city_admin', 'grid_supervisor', 'grid_staff', 'community_manager', 'community_staff', 'community_owner', 'emergency_commander', 'emergency_responder', 'traffic_manager', 'traffic_operator') NOT NULL DEFAULT 'grid_staff'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('super_admin', 'tenant_admin', 'grid_supervisor', 'grid_staff', 'community_manager', 'community_staff', 'community_owner', 'emergency_commander', 'emergency_responder', 'traffic_manager', 'traffic_operator') NOT NULL DEFAULT 'grid_staff'`,
    )
  }
}
