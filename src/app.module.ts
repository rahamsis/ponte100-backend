import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CloudinaryController } from './upload.controller';
import { AppService } from './app.service';
import { PaymentService } from './payment/payment.service';
import { DatabaseModule } from './database/database.module';
import { PaymentModule } from './payment/payment.module';
import { ZoomModule } from 'zoom/zoom.module';
import { ZoomService } from 'zoom/zoom.service';
import { BackblazeModule } from './backblaze/backblaze.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    HttpModule,
    PaymentModule,
    BackblazeModule,
    ZoomModule
  ],
  controllers: [AppController, CloudinaryController],
  providers: [AppService, PaymentService, ZoomService],
})
export class AppModule {}
