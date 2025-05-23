import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import {
  BodyDto, CrudQuestionsDto, IncorrectQuestionsDto, QuantityQuestionsDto,
  SessionDto, SessionTokenDto, UpdateProfileUserDto, UpdateUserDeleteVerification,
  ValidatePersonDto, VerificationTokenDto
} from './dto/body.dto';
import { Response } from 'express';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/backendApi/login')
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

  @Post('backendApi/create-account')
  async createAccount(
    @Res() res: Response,
    @Body() body: BodyDto,
  ) {
    try {
      const data = await this.appService.createAccount(body)

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/create-session')
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

  @Post('/backendApi/active-session')
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

  @Get('/backendApi/temas')
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

  @Post('/backendApi/questions-by-idtema')
  async getQuestionsByIdTema(
    @Res() res: Response,
    @Body() body: { idTema: string, limit: number },
  ) {
    try {
      const data = await this.appService.getQuestionsByIdTema(body.idTema, body.limit);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/questions-habilidades')
  async getQuestionsHabilidades(
    @Res() res: Response,
    @Body() body: { idTema: string, limit: number },
  ) {
    try {
      const data = await this.appService.getQuestionsHabilidades(body.idTema, body.limit);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/questions-and-answer')
  async getQuestionsAndAnswer(
    @Res() res: Response,
    @Body() body: { idTema: string },
  ) {
    try {
      const data = await this.appService.getQuestionsAndAnswer(body.idTema);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/questions-random-with-limit')
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

  @Post('/backendApi/questions-siecopol')
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

  @Post('/backendApi/validate-person-by-cipdni')
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

  @Get('/backendApi/table-exams')
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

  @Post('/backendApi/questions-siecopol-with-offset')
  async getQuestionsSiecopolWithOffset(
    @Res() res: Response,
    @Body() body: { index: number },
  ) {
    try {
      const data = await this.appService.getQuestionsSiecopolWithOffset(body.index);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/save-incorrect-questions')
  async saveIncorrectQuestions(
    @Res() res: Response,
    @Body() body: CrudQuestionsDto,
  ) {
    try {
      const data = await this.appService.saveIncorrectQuestions(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/incorrect-questions')
  async getIncorrectQuestions(
    @Res() res: Response,
    @Body() body: IncorrectQuestionsDto,
  ) {
    try {
      const data = await this.appService.getIncorrectQuestions(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/quantity-questions')
  async getQuantityQuestions(
    @Res() res: Response,
    @Body() body: QuantityQuestionsDto,
  ) {
    try {
      const data = await this.appService.getQuantityQuestions(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/update-incorrect-questions')
  async updateIncorrectQuestions(
    @Res() res: Response,
    @Body() body: CrudQuestionsDto,
  ) {
    try {
      const data = await this.appService.updateIncorrectQuestions(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/save-verification-token')
  async saveVerificationToken(
    @Res() res: Response,
    @Body() body: VerificationTokenDto,
  ) {
    try {
      const data = await this.appService.saveVerificationToken(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/email-verification')
  async getEmailVeification(
    @Res() res: Response,
    @Body() body: SessionTokenDto,
  ) {
    try {
      const data = await this.appService.getEmailVeification(body);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/update-user-verification')
  async updateUserDeleteVerification(
    @Res() res: Response,
    @Body() body: UpdateUserDeleteVerification,
  ) {
    try {
      const data = await this.appService.updateUserDeleteVerification(body);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/user-data')
  async getProfileuser(
    @Res() res: Response,
    @Body() body: UpdateProfileUserDto,
  ) {
    try {
      const data = await this.appService.getProfileuser(body);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/user-update')
  async updateProfileuser(
    @Res() res: Response,
    @Body() body: UpdateProfileUserDto,
  ) {
    try {
      const data = await this.appService.updateProfileuser(body);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('/backendApi/questions-taller')
  async getQuestionsToTaller(
    @Res() res: Response,
    @Body() body: { index: number, limit: number, offset: number },
  ) {
    try {
      const data = await this.appService.getQuestionsToTaller(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
}