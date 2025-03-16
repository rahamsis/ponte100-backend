import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export default (app: NestExpressApplication) => {
  // Configurar Swagger solo si no estamos en producción
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Microservicio de mi padre marido')
      .setDescription(
        'Este microservicio que se encarga hacerme feliz.',
      )
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
};
