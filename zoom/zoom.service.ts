import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ZoomService {
    constructor(private readonly databaseService: DatabaseService) { }

    async createZoomMeeting(): Promise<{ meeting: any }> {
        const token = await this.getZoomAccessToken();

        const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: "Clase Privada",
                type: 1, // instant meeting
                settings: {
                    join_before_host: false,
                    waiting_room: true,
                    approval_type: 0
                }
            })
        });
        const data = await response.json();
        return data; // contiene join_url y start_url
    }

    async getZoomAccessToken(): Promise<string> {

        const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`, {
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const data = await res.json();
        return data.access_token;
    }

    async saveMeeting(idUsuario: string): Promise<any> {
        if (!idUsuario || idUsuario.length === 0) {
            return { message: 'No meeting to save' };
        }

        // Buscar qué progreso ya existen
        const idMeeting = uuidv4();

        // Insertar nuevo progreso
        const result = await this.databaseService.executeQuery(`
            INSERT INTO meetingszoom (idMeeting, idUsuario, createdDate, updatedDate)
            VALUES (?, ?, NOW(), NOW())`,
            [idMeeting, idUsuario]
        );

        return { message: 'Meeting saved successfully', idProgreso: result.insertId };

    }

    async getActiveMeeting(): Promise<{ meeting: any }> {
        const token = await this.getZoomAccessToken();

        const zoomRes = await fetch(`https://api.zoom.us/v2/users/${process.env.ZOOM_CORREO_EMPRESA}/meetings?type=live`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!zoomRes.ok) {
            const errorText = await zoomRes.text();
            console.error('Zoom API Error:', errorText);
            const error = await zoomRes.json();
            return error;
        }

        const data = await zoomRes.json(); // contiene meetings: []
        return data
    }

    async getLastMeeting(): Promise<any> {
        const lastMeeting = await this.databaseService.executeQuery(`
            SELECT u.userId, u.nombre, u.apellidos 
            FROM meetingszoom m
            INNER join users u on u.userId = m.idUsuario
            ORDER BY createdDate DESC LIMIT 1`
        );

       
        return lastMeeting || null;
    }
}
