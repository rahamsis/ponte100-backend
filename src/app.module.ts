import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CloudinaryController } from './upload.controller';
import { AppService } from './app.service';
import { PaymentService } from './payment/payment.service';
import { DatabaseModule } from './database/database.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.local' }),
    DatabaseModule,
    HttpModule,
    PaymentModule,
  ],
  controllers: [AppController, CloudinaryController],
  providers: [AppService, PaymentService],
})
export class AppModule {}
