import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import * as B2 from 'backblaze-b2';

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

    async getSignedDownloadUrl(fileName: string, expiresInSeconds = 600,): Promise<string> {
        try {
            // console.log('Generando URL firmada para:', fileName);
            const auth = await this.b2.getDownloadAuthorization({
                bucketId: this.bucketId,
                fileNamePrefix: fileName,
                validDurationInSeconds: expiresInSeconds,
            });

            return `${this.downloadUrl}/file/${this.bucketName}/${fileName}?Authorization=${auth.data.authorizationToken}`;
        } catch {
            throw new InternalServerErrorException('Error generando URL firmada');
        }
    }

    async listVideos(): Promise<{ name: string; url: string }[]> {
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
                        poster:"https://res.cloudinary.com/dqboodjqt/image/upload/v1750965563/video_p4yf6c.png"
                    };
                }),
            );

            return videos;
        } catch (error) {
            throw new InternalServerErrorException('Error listando videos');
        }
    }

}
