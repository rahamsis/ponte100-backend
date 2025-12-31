import { Controller, Get, Body, Res, HttpStatus } from '@nestjs/common';
import { BackblazeService } from './backblaze.service';
import { ApiTags } from '@nestjs/swagger';
import { ChargeDto } from 'src/dto/body.dto';
import { Response } from 'express';

@ApiTags('backblaze')
@Controller('videos')
export class BackblazeController {
    constructor(private readonly backblazeService: BackblazeService) { }

    @Get('/')
    async createPayment(
        @Body() body: ChargeDto,
        @Res() res: Response,
    ) {
        try {
            const data = await this.backblazeService.listVideos();
            return res.status(HttpStatus.OK).json(data);
        }
        catch (error) {
            return { message: error.message };
        }
    }
}