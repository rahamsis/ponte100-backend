import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CloudinaryController } from './upload.controller';
import { PaymentController } from './payment.controller';
import { AppService } from './app.service';
import { PaymentService } from './payment.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    HttpModule
  ],
  controllers: [AppController, CloudinaryController, PaymentController],
  providers: [AppService, PaymentService],
})
export class AppModule {}
