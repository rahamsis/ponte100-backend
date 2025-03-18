import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { BodyDto, SessionDto, SessionTokenDto, ValidatePersonDto } from './dto/body.dto';
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

  @Get('/api/temas')
  async getTemas(
    @Res() res: Response, 
  ) {
    try {
      const data = await this.appService.getTemas();

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/questions-by-idtema')
  async getQuestionsByIdTema(
    @Res() res: Response,
    @Body() body: { idTema: string },
  ) {
    try {
      const data = await this.appService.getQuestionsByIdTema(body.idTema);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/questions-random-with-limit')
  async getQuestionsRamdonWithLimit(
    @Res() res: Response,
    @Body() body: { limit: number },
  ) {
    try {
      const data = await this.appService.getQuestionsRamdonWithLimit(body.limit);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/questions-siecopol')
  async getQuestionsSiecopol(
    @Res() res: Response,
    @Body() body: { limit: number },
  ) {
    try {
      const data = await this.appService.getQuestionsSiecopol(body.limit);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/validate-person-by-cipdni')
  async validatePersonByCipDni(
    @Res() res: Response,
    @Body() body: ValidatePersonDto,
  ) {
    try {
      const data = await this.appService.validatePersonByCipDni(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Get('/api/table-exams')
  async getTableExams(
    @Res() res: Response,
  ) {
    try {
      const data = await this.appService.getTableExams();
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/questions-siecopol-with-offset')
  async getQuestionsSiecopolWithOffset(
    @Res() res: Response,
    @Body() body: { index: number},
  ) {
    try {
      const data = await this.appService.getQuestionsSiecopolWithOffset(body.index);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/save-incorrect-questions')
  async saveIncorrectQuestions(
    @Res() res: Response,
    @Body() body: { failedQuestions: string[] },
  ) {
    try {
      const data = await this.appService.saveIncorrectQuestions(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/incorrect-questions')
  async getIncorrectQuestions(
    @Res() res: Response,
    @Body() body: { quantity: number },
  ) {
    try {
      const data = await this.appService.getIncorrectQuestions(body.quantity);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/api/quantity-questions')
  async getQuantityQuestions(
    @Res() res: Response,
    @Body() body: { tableName: string },
  ) {
    try {
      const data = await this.appService.getQuantityQuestions(body.tableName);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
}
