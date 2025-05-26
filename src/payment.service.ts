import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
    constructor(private readonly httpService: HttpService) { }

    private generateSignature(amount: number, currency: string, orderId: string, shaKey: string): string {
        const dataString = `${amount}${currency}${orderId}${shaKey}`;
        const hash = crypto.createHash('sha256').update(dataString).digest('hex');
        return hash.toUpperCase();
    }

    async generateFormToken(amount: number, orderId: string) {
        const apiUrl = `https://secure.micuentaweb.pe/api-payment/V4/Charge/CreatePayment`;

        const username = '55969919';
        const password = 'testpassword_RijgPCqmioVWBsAkYhjAmrjwpn6ZIDftLArn0Ay2rThJt';
        const shaKey = 'DR8f0f8dfOztGRJaskpw2R17rP9R0A5YFSdBiYwp9w30l';
        console.log("amount", amount);
        console.log("orderId", orderId);
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new Error(`El amount debe ser un número entero en centavos mayor a 0. Valor recibido: ${amount}`);
        }

        // Payload a enviar
        const payload = {
            amount, // centavos
            currency: 'PEN',
            orderId,
            "paymentConfig": {
                "paymentMethod": "ALL"  // Esto habilita Yape, Visa, etc.
            },
            customer: {
                email: 'rahamsiscg.95@gmail.com', // opcional pero recomendado
            },
            signature: this.generateSignature(amount, 'PEN', orderId, shaKey),
        };

        const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

        const headers = {
            Authorization: authHeader,
            'Content-Type': 'application/json',
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, payload, { headers }),
            );

            console.log('Response:', response.data);

            // Verifica que la respuesta tenga el formToken
            if (!response.data.answer?.formToken) {
                throw new Error('No se recibió formToken en la respuesta');
            }

            return {
                formToken: response.data.answer.formToken,
                orderId,
                amount,
            };
        } catch (error) {
            throw new Error(
                error.response?.data?.message || error.message || 'Error en la creación del pago',
            );
        }
    }
}
