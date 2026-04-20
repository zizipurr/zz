import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddEventTimelineFields1778100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('events')
    if (!table) return

    const ensureAdd = async (column: TableColumn) => {
      const exists = table.findColumnByName(column.name)
      if (!exists) {
        await queryRunner.addColumn('events', column)
      }
    }

    await ensureAdd(new TableColumn({ name: 'dispatcher', type: 'varchar', isNullable: true }))
    await ensureAdd(new TableColumn({ name: 'dispatchedAt', type: 'datetime', isNullable: true }))
    await ensureAdd(new TableColumn({ name: 'startedAt', type: 'datetime', isNullable: true }))
    await ensureAdd(new TableColumn({ name: 'completedAt', type: 'datetime', isNullable: true }))
    await ensureAdd(new TableColumn({ name: 'completionResult', type: 'text', isNullable: true }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('events')
    if (!table) return
    const cols = ['completionResult', 'completedAt', 'startedAt', 'dispatchedAt', 'dispatcher']
    for (const name of cols) {
      const col = table.findColumnByName(name)
      if (col) {
        await queryRunner.dropColumn('events', col)
      }
    }
  }
}

