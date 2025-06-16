import { Module } from '@nestjs/common';
import { ZoomController } from './zoom.controller';
import { ZoomService } from './zoom.service';
import { HttpModule } from '@nestjs/axios';
import { DatabaseService } from 'src/database/database.service';

@Module({
    imports: [HttpModule],
    controllers: [ZoomController],
    providers: [ZoomService, DatabaseService],
})
export class ZoomModule { }