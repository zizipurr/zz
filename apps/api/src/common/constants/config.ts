export const ENV_FILE_PATHS = ['.env.local', '.env'] as const

export const DB_CONFIG_KEYS = {
  HOST: 'DB_HOST',
  PORT: 'DB_PORT',
  USERNAME: 'DB_USER',
  PASSWORD: 'DB_PASSWORD',
  DATABASE: 'DB_NAME',
} as const

export const DB_DEFAULTS = {
  TYPE: 'mysql',
  HOST: 'localhost',
  PORT: 3306,
  USERNAME: 'root',
  PASSWORD: '123456',
  DATABASE: 'zcy_platform',
  MIGRATIONS_TABLE_NAME: 'migrations',
} as const
