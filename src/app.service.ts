import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { BodyDto, SessionDto, SessionTokenDto } from './dto/body.dto';
import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {

  constructor(private readonly databaseService: DatabaseService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async getLogin(body: BodyDto): Promise<{ message: string }> {
    const user = await this.databaseService.executeQuery(`SELECT u.*, s.userIp, s.userDevice 
      FROM users u 
      LEFT JOIN sessions s ON s.userId = u.userId 
      WHERE u.email=?`, [
      body.email,
    ]);

    if (user.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const passwordsMatch = await bcrypt.compare(body.password, user[0].password);
    if (!passwordsMatch) {
      throw new Error('Tú contraseña no es válida.');
    }

    return user[0];
  }

  async createSession(body: SessionDto): Promise<{ sessionId }> {
    await this.databaseService.executeQuery(`DELETE FROM sessions WHERE userId = ?`, [body.userId]);

    const sessionId = uuidv4();

    await this.databaseService.executeQuery(`INSERT INTO sessions (sessionId, userId, userDevice, userIp, sessionToken, sessionExpires, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [sessionId, body.userId, body.userDevice, body.userIp, body.sessionToken, body.sessionExpires]);

    return { sessionId };
  }

  async activeSession(body: SessionTokenDto): Promise<{ sessionId }> {
    const session = await this.databaseService.executeQuery(`SELECT * FROM sessions 
            WHERE sessionToken = ? AND sessionExpires > NOW()
            ORDER BY createdAt DESC LIMIT 1`, [body.sessionToken]);

    return session[0] || null;
  }
}
