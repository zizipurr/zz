import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddSceneToEvents1777000000000 implements MigrationInterface {
  name = 'AddSceneToEvents1777000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'scene',
        type: 'enum',
        enum: ['ioc', 'community', 'emergency', 'traffic', 'service'],
        default: "'ioc'",
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'scene')
  }
}

