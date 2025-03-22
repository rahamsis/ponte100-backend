import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import configureCors from './config/cors.config';
import swaggerConfig from './config/swagger.config';
import bodyConfig from './config/body.config';

async function bootstrap() {
  // Crear la aplicación
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Llamar a la función para configurar CORS
  configureCors(app);

  // Llamar a la función para configurar Swagger
  swaggerConfig(app);

  // Llamar a la función para configurar el parser de body
  bodyConfig(app);

  // Iniciar la aplicación
  await app.listen(process.env.PORT!);
}

// Llamar a la función principal de la aplicación
bootstrap();
