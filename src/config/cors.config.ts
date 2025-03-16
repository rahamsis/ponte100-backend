import { NestExpressApplication } from '@nestjs/platform-express';

export default (app: NestExpressApplication) => {
  // Configurar CORS basado en variables de entorno
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*', // Usa el valor de CORS_ORIGIN o permite todos en caso de no estar definido
  };

  app.enableCors(corsOptions);
};
