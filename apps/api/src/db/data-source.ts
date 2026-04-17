import { DataSource } from 'typeorm'
import { config as loadEnv } from 'dotenv'
import { join } from 'path'
import { DB_DEFAULTS, ENV_FILE_PATHS } from '@/common/constants/config'

// 加载 .env（CLI 脱离 Nest 运行时需要手动加载）；.env.local 覆盖同名键
for (const envFilePath of ENV_FILE_PATHS) {
  loadEnv({ path: join(process.cwd(), envFilePath) })
}


export const AppDataSource = new DataSource({
  type: DB_DEFAULTS.TYPE,
  host: process.env.DB_HOST ?? DB_DEFAULTS.HOST,
  port: Number(process.env.DB_PORT ?? DB_DEFAULTS.PORT),
  username: process.env.DB_USER ?? DB_DEFAULTS.USERNAME,
  password: process.env.DB_PASSWORD ?? DB_DEFAULTS.PASSWORD,
  database: process.env.DB_NAME ?? DB_DEFAULTS.DATABASE,
  synchronize: false,
  logging: false,
  entities: [join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: DB_DEFAULTS.MIGRATIONS_TABLE_NAME,
})