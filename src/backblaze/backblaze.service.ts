import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import * as B2 from 'backblaze-b2';
import { PDFItem, VideoItem } from 'src/dto/backblaze.dt';

@Injectable()
export class BackblazeService implements OnModuleInit {
    private b2: any; // ✅ correcto aquí
    private bucketId: string;
    private bucketName: string;
    private downloadUrl: string;

    constructor() {
        this.b2 = new (B2 as any)({
            applicationKeyId: process.env.B2_KEY_ID!,
            applicationKey: process.env.B2_APPLICATION_KEY!,
        });

        this.bucketId = process.env.B2_BUCKET_ID!;
        this.bucketName = process.env.B2_BUCKET_NAME!;
    }

    async onModuleInit() {
        try {
            await this.b2.authorize();
            this.downloadUrl = this.b2.downloadUrl;
        } catch {
            throw new InternalServerErrorException('Error autorizando Backblaze B2');
        }
    }

    // Stream de cualquier archivo del bucket
    // async getFileStream(filePath: string): Promise<NodeJS.ReadableStream> {
    //     try {
    //         const auth = await this.b2.getDownloadAuthorization({
    //             bucketId: this.bucketId,
    //             fileNamePrefix: filePath,
    //             validDurationInSeconds: 600,
    //         });

    //         const url = `${this.downloadUrl}/${filePath}?Authorization=${auth.data.authorizationToken}`;
    //         const response = await fetch(url);

    //         if (!response.ok) throw new Error('Error descargando archivo de B2');
    //         if (!response.body) throw new Error('No se pudo obtener el stream del archivo');

    //         return response.body as unknown as NodeJS.ReadableStream; // casteamos a NodeJS.ReadableStream
    //     } catch (error) {
    //         throw new InternalServerErrorException(error.message);
    //     }
    // }
    async getFileStream(filePath: string): Promise<NodeJS.ReadableStream> {
        try {
            console.log('Buscando archivo:', filePath);

            // Primero necesitamos obtener el fileId
            const fileList = await this.b2.listFileNames({
                bucketId: this.bucketId,
                prefix: filePath,
                maxFileCount: 1
            });

            if (!fileList.data.files || fileList.data.files.length === 0) {
                throw new Error(`Archivo no encontrado: ${filePath}`);
            }

            const fileInfo = fileList.data.files[0];
            console.log('FileInfo encontrado:', fileInfo);

            // Ahora descargamos usando el fileId
            const downloadResponse = await this.b2.downloadFileById({
                fileId: fileInfo.fileId
            });

            // Crear un stream a partir de la respuesta
            const { Readable } = await import('stream');
            const stream = new Readable();
            stream.push(downloadResponse.data);
            stream.push(null); // Indica el final del stream

            return stream;

        } catch (error) {
            console.error('Error en getFileStream:', error);
            throw new InternalServerErrorException(`Error obteniendo archivo: ${error.message}`);
        }
    }

    async listVideos(): Promise<VideoItem[]> {
        try {
            const files = await this.b2.listFileNames({
                bucketId: this.bucketId,
                prefix: 'clases/', // carpeta opcional
                maxFileCount: 1000,
            });

            const videos = await Promise.all(
                files.data.files.map(async (file) => {
                    const auth = await this.b2.getDownloadAuthorization({
                        bucketId: this.bucketId,
                        fileNamePrefix: file.fileName,
                        validDurationInSeconds: 600,
                    });

                    return {
                        name: file.fileName,
                        url: `${this.downloadUrl}/file/${this.bucketName}/${file.fileName}?Authorization=${auth.data.authorizationToken}`,
                        createdAt: new Date(file.uploadTimestamp).toISOString(),
                        author: file.fileInfo?.author ?? "Desconocido",
                        poster: "https://res.cloudinary.com/dqboodjqt/image/upload/v1750965563/video_p4yf6c.png"
                    };
                }),
            );

            return videos;
        } catch (error) {
            throw new InternalServerErrorException('Error listando videos');
        }
    }

    async listPDFs(): Promise<PDFItem[]> {
        try {
            // 1. Listamos PDFs y covers en paralelo
            const [pdfFiles, coverFiles] = await Promise.all([
                this.b2.listFileNames({
                    bucketId: this.bucketId,
                    prefix: 'banco-preguntas/',
                    delimiter: '/', // Agregar delimitador
                    maxFileCount: 1000,
                }),
                this.b2.listFileNames({
                    bucketId: this.bucketId,
                    prefix: 'covers/',
                    delimiter: '/',
                    maxFileCount: 1000,
                }),
            ]);

            const bucket = 'banco-preguntas';

            // 2. Creamos mapa de portadas con el nombre base
            const coverMap: Record<string, string> = {};
            for (const file of coverFiles.data.files) {
                const fileName = file.fileName.split('/').pop(); // Nombre completo con extensión
                if (!fileName) continue;

                // Extraer solo el nombre base (sin extensión)
                const baseName = fileName.replace(/\.(png|jpg|jpeg)$/, '');

                // URL usando tu backend como proxy - incluir el nombre completo del archivo
                coverMap[baseName] = `${process.env.BACKEND_URL}/pdf/cover/${encodeURIComponent(fileName)}`;
            }

            // 3. Generamos listado final de PDFs con su cover correspondiente
            const pdfs: PDFItem[] = [];
            for (const file of pdfFiles.data.files) {
                const fileName = file.fileName.split('/').pop(); // Nombre completo con extensión
                if (!fileName || !fileName.endsWith('.pdf')) continue;

                // Extraer solo el nombre base (sin .pdf)
                const baseName = fileName.replace(/\.pdf$/, '');

                // URL usando tu backend como proxy
                pdfs.push({
                    name: fileName, // Solo el nombre del archivo
                    url: `${process.env.BACKEND_URL}/pdf/file/${bucket}/${encodeURIComponent(fileName)}`,
                    poster: coverMap[baseName] || "null",
                });
            }

            return pdfs;
        } catch (error) {
            throw new InternalServerErrorException('Error listando PDFs');
        }
    }

    async listNormas(): Promise<PDFItem[]> {
        try {
            // 1. Listamos PDFs y covers en paralelo
            const [pdfFiles, coverFiles] = await Promise.all([
                this.b2.listFileNames({
                    bucketId: this.bucketId,
                    prefix: 'normas/',
                    delimiter: '/',
                    maxFileCount: 1000,
                }),
                this.b2.listFileNames({
                    bucketId: this.bucketId,
                    prefix: 'covers/',
                    delimiter: '/',
                    maxFileCount: 1000,
                }),
            ]);

            const bucket = 'normas';

            // 2. Creamos mapa de portadas con el nombre base
            const coverMap: Record<string, string> = {};
            for (const file of coverFiles.data.files) {
                const fileName = file.fileName.split('/').pop();
                if (!fileName) continue;

                const baseName = fileName.replace(/\.(png|jpg|jpeg)$/, '');
                coverMap[baseName] = `${process.env.BACKEND_URL}/pdf/cover/${encodeURIComponent(fileName)}`;
            }

            // 3. Generamos listado final de PDFs
            const pdfs: PDFItem[] = [];
            for (const file of pdfFiles.data.files) {
                const fileName = file.fileName.split('/').pop();
                if (!fileName || !fileName.endsWith('.pdf')) continue;

                const baseName = fileName.replace(/\.pdf$/, '');

                pdfs.push({
                    name: fileName,
                    url: `${process.env.BACKEND_URL}/pdf/file/${bucket}/${encodeURIComponent(fileName)}`,
                    poster: coverMap[baseName] || "null",
                });
            }

            return pdfs;
        } catch (error) {
            throw new InternalServerErrorException('Error listando PDFs normas');
        }
    }
}
