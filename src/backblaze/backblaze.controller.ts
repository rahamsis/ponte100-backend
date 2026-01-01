import { Controller, Get, HttpStatus, HttpException, Param, Res } from '@nestjs/common';
import { BackblazeService } from './backblaze.service';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('backblaze')
@Controller()
export class BackblazeController {
    constructor(private readonly backblazeService: BackblazeService) { }

    // Endpoint proxy para servir la portada (cover)
    @Get('cover/:coverName')
    async getCover(@Param('coverName') coverName: string, @Res() res: Response) {
        try {
            const stream = await this.backblazeService.getFileStream(`covers/${decodeURIComponent(coverName)}.png`);
            res.setHeader('Content-Type', 'image/png');
            stream.pipe(res);
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error obteniendo cover' });
        }
    }

    // Endpoint proxy para servir el PDF
    @Get('file:fileName')
    async getPdf(
        @Param('fileName') fileName: string,
        @Param('bucket') bucket: string,
        @Res() res: Response
    ) {
        try {
            const stream = await this.backblazeService.getFileStream(`${bucket}/${decodeURIComponent(fileName)}`);
            res.setHeader('Content-Type', 'application/pdf');
            stream.pipe(res);
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error obteniendo PDF' });
        }
    }

    // Endpoints para listar archivos - endpoints tradicionales
    @Get('/videos')
    async listVideos() {
        try {
            const data = await this.backblazeService.listVideos();
            return data;
        } catch (error) {
            throw new HttpException(
                error.message || 'Error inesperado',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('/banco-preguntas')
    async listPDFs() {
        try {
            const data = await this.backblazeService.listPDFs();
            return data;
        } catch (error) {
            throw new HttpException(
                error.message || 'Error inesperado',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('/normas')
    async listNormas() {
        try {
            const data = await this.backblazeService.listNormas();
            return data;
        } catch (error) {
            throw new HttpException(
                error.message || 'Error inesperado',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}