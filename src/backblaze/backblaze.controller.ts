import { Controller, Get, HttpStatus, HttpException, Param, Res, StreamableFile } from '@nestjs/common';
import { BackblazeService } from './backblaze.service';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('backblaze')
@Controller()
export class BackblazeController {
    constructor(private readonly backblazeService: BackblazeService) { }

    // Endpoint proxy para servir la portada (cover)
    @Get('pdf/cover/:coverName')
    async getCover(@Param('coverName') coverName: string, @Res() res: Response) {
        try {
            const stream = await this.backblazeService.getFileStream(`covers/${decodeURIComponent(coverName)}`);
            // Detectar tipo de imagen dinámicamente
            const extension = coverName.split('.').pop()?.toLowerCase();
            const contentType = extension === 'jpg' || extension === 'jpeg'
                ? 'image/jpeg'
                : extension === 'png'
                    ? 'image/png'
                    : 'application/octet-stream';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Accept-Ranges', 'bytes');
            if (stream instanceof StreamableFile) {
                (stream as StreamableFile).getStream().pipe(res);
            } else if (typeof (stream as any)?.pipe === 'function') {
                (stream as any).pipe(res);
            } else {
                res.send(stream);
            }
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).json({ message: 'Cover no encontrado' });
        }
    }

    // Endpoint proxy para servir el PDF
    @Get('pdf/file/:bucket/:fileName')
    async getPdf(
        @Param('bucket') bucket: string,
        @Param('fileName') fileName: string,
        @Res() res: Response
    ) {
        try {
            // Decodificar el nombre del archivo y añadir la carpeta
            const fullPath = `${bucket}/${decodeURIComponent(fileName)}`;
            const stream = await this.backblazeService.getFileStream(fullPath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            res.setHeader('Accept-Ranges', 'bytes');
            stream.pipe(res);
        } catch (error) {
            console.error('Error obteniendo PDF:', error);
            res.status(HttpStatus.NOT_FOUND).json({ message: 'PDF no encontrado' });
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