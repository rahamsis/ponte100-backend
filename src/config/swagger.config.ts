import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export default (app: NestExpressApplication) => {
  // Configurar Swagger solo si no estamos en producción
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Microservicio de Ponte100')
      .setDescription(
        `Este microservicio se encarga de administrar los endpoint's necesarios
         para el funcionamiento del simulador Ponte100.`,
      )
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document,  {
      swaggerOptions: {
        // Aseguramos que Swagger tome el prefijo global para las rutas
        url: `/backendApi/docs`
      }
    });
  }
};
