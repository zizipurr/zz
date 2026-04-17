export const AUTH_CONFIG_KEYS = {
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRES: 'JWT_EXPIRES',
} as const

export const AUTH_DEFAULTS = {
  JWT_SECRET: 'zcy_platform_secret_2026',
  JWT_EXPIRES: '7d',
} as const
