import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { QueryFailedError } from 'typeorm'
import { ApiResponse } from '../interfaces'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // 数据库唯一性冲突（MySQL errno 1062）
    if (exception instanceof QueryFailedError) {
      const err = exception as any
      const isDupEntry = err.errno === 1062 || err.code === 'ER_DUP_ENTRY'
      const status = isDupEntry ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_SERVER_ERROR
      const message = isDupEntry ? '数据已存在，请勿重复提交' : '数据库操作失败，请稍后重试'
      this.logger.error(
        `[${request.method}] ${request.url} → ${status} DB error: ${exception.message}`,
        exception.stack,
      )
      response.status(status).json({ code: status, data: null, message } as ApiResponse<null>)
      return
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    let message = '服务器内部错误'
    if (exception instanceof HttpException) {
      const res = exception.getResponse()
      if (typeof res === 'string') {
        message = res
      } else if (typeof res === 'object' && res !== null) {
        const msg = (res as any).message
        message = Array.isArray(msg) ? msg.join('; ') : msg ?? exception.message
      }
    } else if (exception instanceof Error) {
      message = exception.message
    }

    this.logger.error(
      `[${request.method}] ${request.url} → ${status} ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    )

    const body: ApiResponse<null> = {
      code: status,
      data: null,
      message,
    }

    response.status(status).json(body)
  }
}
