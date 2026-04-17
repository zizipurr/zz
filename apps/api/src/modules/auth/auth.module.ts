import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '@/modules/user/user.module'
import { WechatModule } from '@/modules/wechat/wechat.module'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './jwt.strategy'
import { AUTH_CONFIG_KEYS, AUTH_DEFAULTS } from './auth.constants'

@Module({
  imports: [
    UserModule,
    WechatModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const expiresIn = config.get<string>(AUTH_CONFIG_KEYS.JWT_EXPIRES, AUTH_DEFAULTS.JWT_EXPIRES) as NonNullable<
          NonNullable<JwtModuleOptions['signOptions']>['expiresIn']
        >

        return {
          secret: config.get<string>(AUTH_CONFIG_KEYS.JWT_SECRET, AUTH_DEFAULTS.JWT_SECRET),
          signOptions: { expiresIn },
        }
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
