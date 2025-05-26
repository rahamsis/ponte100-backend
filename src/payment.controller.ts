import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('/form-token')
    async createPayment(
        @Body() body: { amount: number; orderId: string }
    ) {
        try {
            const data = await this.paymentService.generateFormToken(body.amount, body.orderId);
            return data;
        }
        catch (error) {
            return { message: error.message };
        }
    }
}