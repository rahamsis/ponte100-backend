import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
    constructor(private readonly httpService: HttpService) { }

    async generateFormToken(body) {

        const { token, email, amount, producto, cliente } = body;

        try {
            const response = await fetch("https://api.culqi.com/v2/charges", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.CULQI_SECRET_KEY}`,
                },
                body: JSON.stringify({
                    amount,
                    currency_code: "PEN",
                    email,
                    source_id: token,
                    metadata: {
                        producto,
                        ...cliente,
                    }
                }),
            });

            const result = await response.json();
            // console.log("RESULT: ", result)

            if (!response.ok) {
                // Culqi devolvió error
                throw new BadRequestException(result);
            }

            return result;
        } catch (error) {
            throw new InternalServerErrorException(error.message || 'Error interno del servidor');
        }
    }
}
