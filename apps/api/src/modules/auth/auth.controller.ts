import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional } from 'class-validator'

class LoginDto {
  /** 用户名或 11 位手机号（与小程序占位一致） */
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  password: string

  /** 小程序 wx.login 返回的 code（可选，传了会尝试绑定 openid） */
  @IsOptional()
  @IsString()
  wxCode?: string
}

class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  username: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  realName: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string

  @IsString()
  @IsNotEmpty()
  district: string
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录（用户名或手机号 + 密码）' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.username.trim(), body.password)
    return this.authService.login(user, body.wxCode)
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册（固定注册为网格员）' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户资料（含工号、手机号等，不含密码）' })
  async profile(@Request() req: { user: { userId: number } }) {
    return this.authService.getProfile(req.user.userId)
  }
}
