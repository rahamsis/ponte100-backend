import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { BodyDto, SessionDto, SessionTokenDto } from './dto/body.dto';
import { Response } from 'express';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/api/login')
  async getLogin(
    @Res() res: Response,
    @Body() body: BodyDto,
  ) {
    try {
      const data = await this.appService.getLogin(body);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/create-session')
  async createSession(
    @Res() res: Response,
    @Body() body: SessionDto,
  ) {
    try {
      console.log("*******************")
      console.log(body)
      const data = await this.appService.createSession(body);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/active-session')
  async activeSession(
    @Res() res: Response,
    @Body() body: SessionTokenDto,
  ) {
    try {
      const data = await this.appService.activeSession(body);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
}
