import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AUTH_CONFIG_KEYS, AUTH_DEFAULTS } from './auth.constants'
import { JwtPayload } from './auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>(AUTH_CONFIG_KEYS.JWT_SECRET, AUTH_DEFAULTS.JWT_SECRET),
    })
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
      district: payload.district ?? null,
      realName: payload.realName ?? null,
    }
  }
}
