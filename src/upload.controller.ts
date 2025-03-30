import { Controller, Get, Query } from '@nestjs/common';
import cloudinary from './config/cloudinary.config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller('cloudinary')
export class CloudinaryController {
  @Get('/signature')
  generateSignature(@Query('public_id') publicId: string) {

    const timestamp = Math.floor(Date.now() / 1000);
        const stringToSign = `folder=profilesPonte100&public_id=${publicId}&timestamp=${timestamp}`;

    const signature = require('crypto')
    .createHash('sha1')
    .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

    return {
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
    };
  }
}
