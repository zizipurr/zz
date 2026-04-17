import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { seedDemo } from "./db/seeds/seed-demo";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);  // migrationsRun: true，建表在这里完成

  await seedDemo();

  // 与前端 baseURL `/api`、Vite proxy 一致
  // app.setGlobalPrefix("api");

  // 基础中间件
  // H5 开发（localhost:800x）会携带 Authorization 触发预检请求（OPTIONS）。
  // 这里显式放开常用方法/请求头，避免出现“预检非 2xx”导致的 CORS 报错。
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle("智城云 API")
    .setDescription("智城云 IOC 平台后端接口文档")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        in: "header",
      },
      "JWT-auth" // 这个 key 在 controller 里用 @ApiBearerAuth('JWT-auth') 引用
    )
    .addTag("auth", "认证授权")
    .addTag("event", "事件中心")
    .addTag("message", "消息中心")
    .addTag("kpi", "指标数据")
    .addTag("user", "用户管理")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // 全局前缀已为 api，此处用 api/docs → 访问 /api/docs
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 刷新页面保留 token
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 API 服务已启动: http://localhost:${port}/api`);
  console.log(`📖 Swagger 文档: http://localhost:${port}/api/docs`);
}

bootstrap();
