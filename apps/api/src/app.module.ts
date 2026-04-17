import { Module } from '@nestjs/common'
import * as path from 'path'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { EventModule } from './modules/event/event.module'
import { MessageModule } from './modules/message/message.module'
import { KpiModule } from './modules/kpi/kpi.module'
import { MockdevModule } from './modules/mockdev/mockdev.module'
import { LocationsController } from './common/locations.controller'
import { DB_DEFAULTS, ENV_FILE_PATHS } from '@/common/constants/config'

@Module({
  controllers: [LocationsController],
  imports: [
    // 环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [...ENV_FILE_PATHS]
    }),

    // 数据库连接
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: DB_DEFAULTS.TYPE,
        host: config.get<string>('DB_HOST') || DB_DEFAULTS.HOST,
        port: Number(config.get<string>('DB_PORT') || String(DB_DEFAULTS.PORT)),
        username: config.get<string>('DB_USER') || DB_DEFAULTS.USERNAME,
        password: config.get<string>('DB_PASSWORD') || DB_DEFAULTS.PASSWORD,
        database: config.get<string>('DB_NAME') || DB_DEFAULTS.DATABASE,
        autoLoadEntities: true,                                        // ← 替代手写 entities，自动加载所有注册的 Entity
        synchronize: false,                                            // 禁止自动改表，由 migration 统一管理
        migrations: [path.join(__dirname, 'db', 'migrations', '*{.ts,.js}')],  // ← 用 path.join 更跨平台
        migrationsRun: true,                                           // 启动时自动执行未跑过的 migration
        logging: false,                                                // 关闭 SQL 日志（调试时可改 true）
      }),
    }),

    // 业务模块
    AuthModule,
    UserModule,
    EventModule,
    MessageModule,
    KpiModule,
    MockdevModule,
  ],
})
export class AppModule {}