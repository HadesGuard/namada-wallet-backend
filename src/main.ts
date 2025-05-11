import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('app.port') || 3000;

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Namada Wallet API')
    .setDescription('The Namada Wallet API documentation')
    .setVersion('1.0')
    .addTag('Account')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(
    `Server is running on port ${port}, http://localhost:${port}/docs`,
  );
}
bootstrap();
