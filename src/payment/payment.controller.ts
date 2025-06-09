import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags } from '@nestjs/swagger';
import { ChargeDto } from 'src/dto/body.dto';


@ApiTags('Payment')
@Controller('culqui')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('/charge')
    async createPayment(
        @Body() body: ChargeDto
    ) {
        try {
            const data = await this.paymentService.generateFormToken(body);
            return data;
        }
        catch (error) {
            return { message: error.message };
        }
    }
}