import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Namada Wallet API')
    .setDescription('The Namada Wallet API documentation')
    .setVersion('1.0')
    .addTag('Account')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(3000);
  console.log('Server is running on port 3000, http://localhost:3000/docs');
}
bootstrap();
