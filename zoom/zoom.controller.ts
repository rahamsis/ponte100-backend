import { Controller, Post, Body, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ZoomService } from './zoom.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Zoom')
@Controller('zoom')
export class ZoomController {
    constructor(private readonly zoomService: ZoomService) { }

    @Get('/create-meeting')
    async createZoomMeeting(
        @Res() res: Response
    ) {
        try {
            const data = await this.zoomService.createZoomMeeting();

            return res.status(HttpStatus.OK).json({data});
        }
        catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message
            });
        }
    }

    @Post('/save-meeting')
      async saveMeeting(
        @Res() res: Response,
        @Body() body: {idUsuario: string},
      ) {
        try {
          const data = await this.zoomService.saveMeeting(body.idUsuario);
          return res.status(HttpStatus.OK).json(data);
        } catch (error) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
      }

    @Get('/active-meeting')
    async getActiveMeeting(
        @Res() res: Response
    ) {
        try {
            const data = await this.zoomService.getActiveMeeting();

            return res.status(HttpStatus.OK).json({data});
        }
        catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message
            });
        }
    }

    @Get('/last-meeting')
    async getLastMeeting(
        @Res() res: Response
    ) {
        try {
            const data = await this.zoomService.getLastMeeting();

            return res.status(HttpStatus.OK).json({data});
        }
        catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message
            });
        }
    }
}