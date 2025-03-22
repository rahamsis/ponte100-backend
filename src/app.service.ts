import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { BodyDto, SessionDto, SessionTokenDto, ValidatePersonDto } from './dto/body.dto';
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
      throw new Error('el correo ingresado no es valido');
    }

    const passwordsMatch = await bcrypt.compare(body.password, user[0].password);
    if (!passwordsMatch) {
      throw new Error('Tú contraseña no es válida.');
    }

    return user[0];
  }

  async createAccount(body: BodyDto): Promise<{ message: string }> {
    const email = body.email.toLowerCase().trim();
    const password = body.password.trim();

    const user = await this.databaseService.executeQuery(`SELECT userId FROM users WHERE email = ?`, [
      email,
    ]);

    if (user.length > 0) {
      return { message: "El email ya está en uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await this.databaseService.executeQuery(`INSERT INTO users (userId, name, email, password)
        VALUES (?,?,?,?)`, [
          uuidv4(),
          body.username,
          email,
          hashedPassword
    ]);

    return {message: "Cuenta creada exitosamente"}
  }

  async createSession(body: SessionDto): Promise<{ sessionId: string }> {
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

  async getTemas(): Promise<any> {
    const temas = await this.databaseService.executeQuery(`SELECT * FROM temas`);

    return temas || null;
  }

  async getQuestionsByIdTema(idTema: string): Promise<any> {
    const questions = await this.databaseService.executeQuery(`SELECT p.idPregunta AS id, p.pregunta AS question, 
            GROUP_CONCAT(CONCAT(a.idAlternativa,"@", a.alternativa) ORDER BY a.idAlternativa SEPARATOR '||') AS options, 
            (SELECT a2.idAlternativa 
                FROM alternativas a2 
                WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
            ) AS correctAnswer 
            FROM preguntas p 
            INNER JOIN alternativas a ON a.idPregunta = p.idPregunta 
            WHERE p.idTema = ?
            GROUP BY p.idPregunta`, [idTema]);
    return questions || null;
  }

  async getQuestionsRamdonWithLimit(limite: number): Promise<any> {
    let questionIds;
    if (limite === 100 || limite === 50) {
      const temas = [
        { idTema: 'T00001', limit: (limite === 100) ? 8 : 4 },
        { idTema: 'T00002', limit: (limite === 100) ? 4 : 2 },
        { idTema: 'T00003', limit: (limite === 100) ? 8 : 4 },
        { idTema: 'T00004', limit: (limite === 100) ? 8 : 4 },
        { idTema: 'T00005', limit: (limite === 100) ? 6 : 3 },
        { idTema: 'T00006', limit: (limite === 100) ? 3 : 2 },
        { idTema: 'T00007', limit: (limite === 100) ? 8 : 4 },
        { idTema: 'T00008', limit: (limite === 100) ? 3 : 2 },
        { idTema: 'T00009', limit: (limite === 100) ? 4 : 2 },
        { idTema: 'T00010', limit: (limite === 100) ? 4 : 2 },
        { idTema: 'T00011', limit: (limite === 100) ? 3 : 2 },
        { idTema: 'T00012', limit: (limite === 100) ? 3 : 2 },
        { idTema: 'T00013', limit: (limite === 100) ? 12 : 5 },
        { idTema: 'T00014', limit: (limite === 100) ? 14 : 6 },
        { idTema: 'T00015', limit: (limite === 100) ? 2 : 1 },
        { idTema: 'T00016', limit: (limite === 100) ? 3 : 2 },
        { idTema: 'T00017', limit: (limite === 100) ? 5 : 2 },
        { idTema: 'T00018', limit: (limite === 100) ? 2 : 1 },
      ];

      // Ejecutar todas las consultas en paralelo
      const queries = temas.map(({ idTema, limit }) =>
        this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idTema = ? 
              ORDER BY RAND() LIMIT ?`, [idTema, limit])
      );

      // Esperar a que todas las consultas terminen
      const results = await Promise.all(queries);

      // Extraer los IDs de todas las preguntas seleccionadas
      questionIds = results.flatMap((rows) =>
        rows.map((q: { idPregunta: string }) => q.idPregunta));

    } else {
      // Obtener preguntas aleatorias de manera eficiente, según la cantidad solicitada
      const randomQuestions = await this.databaseService.executeQuery(`
      SELECT idPregunta FROM preguntas ORDER BY RAND() LIMIT ?;
      `, [limite]);

      questionIds = randomQuestions.map((q: { idPregunta: string }) => q.idPregunta);
    }

    const questionIdsString = questionIds.map(id => `'${id}'`).join(", ");

    // Traer los detalles de esas preguntas y sus respuestas
    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema,
      GROUP_CONCAT(CONCAT(a.idAlternativa, "@", a.alternativa) ORDER BY RAND() SEPARATOR '||') AS options, 
      (SELECT a2.idAlternativa 
          FROM alternativas a2 
          WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
      ) AS correctAnswer 
      FROM preguntas p 
      INNER JOIN alternativas a ON a.idPregunta = p.idPregunta
      INNER JOIN temas t ON t.idTema = p.idTema
      WHERE p.idPregunta IN (${questionIdsString})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`);

    return questions || null;
  }

  async getQuestionsSiecopol(limite: number): Promise<any> {
    const temas = [
      { idTema: 'T00001', limit: (limite === 100) ? 8 : 4 },
      { idTema: 'T00002', limit: (limite === 100) ? 4 : 2 },
      { idTema: 'T00003', limit: (limite === 100) ? 8 : 4 },
      { idTema: 'T00004', limit: (limite === 100) ? 8 : 4 },
      { idTema: 'T00005', limit: (limite === 100) ? 6 : 3 },
      { idTema: 'T00006', limit: (limite === 100) ? 3 : 2 },
      { idTema: 'T00007', limit: (limite === 100) ? 8 : 4 },
      { idTema: 'T00008', limit: (limite === 100) ? 3 : 2 },
      { idTema: 'T00009', limit: (limite === 100) ? 4 : 2 },
      { idTema: 'T00010', limit: (limite === 100) ? 4 : 2 },
      { idTema: 'T00011', limit: (limite === 100) ? 3 : 2 },
      { idTema: 'T00012', limit: (limite === 100) ? 3 : 2 },
      { idTema: 'T00013', limit: (limite === 100) ? 12 : 5 },
      { idTema: 'T00014', limit: (limite === 100) ? 14 : 6 },
      { idTema: 'T00015', limit: (limite === 100) ? 2 : 1 },
      { idTema: 'T00016', limit: (limite === 100) ? 3 : 2 },
      { idTema: 'T00017', limit: (limite === 100) ? 5 : 2 },
      { idTema: 'T00018', limit: (limite === 100) ? 2 : 1 },
    ];

    // Ejecutar todas las consultas en paralelo
    const queries = temas.map(({ idTema, limit }) =>
      this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idTema = ? 
        ORDER BY RAND() LIMIT ?`, [idTema, limit])
    );

    // Esperar a que todas las consultas terminen
    const results = await Promise.all(queries);

    // Extraer los IDs de todas las preguntas seleccionadas
    const questionIds = results.flatMap((rows) =>
      rows.map((q: { idPregunta: string }) => q.idPregunta));

    const questionIdsString = questionIds.map(id => `'${id}'`).join(", ");

    // Traer los detalles de esas preguntas y sus respuestas
    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema,
      GROUP_CONCAT(CONCAT(a.idAlternativa, "@", a.alternativa) ORDER BY RAND() SEPARATOR '||') AS options, 
      (SELECT a2.idAlternativa 
          FROM alternativas a2 
          WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
      ) AS correctAnswer 
      FROM preguntas p 
      INNER JOIN alternativas a ON a.idPregunta = p.idPregunta
      INNER JOIN temas t ON t.idTema = p.idTema
      WHERE p.idPregunta IN (${questionIdsString})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`);

    return questions || null;
  }

  async validatePersonByCipDni(body: ValidatePersonDto): Promise<any> {
    const person = await this.databaseService.executeQuery(`SELECT * FROM users 
      WHERE email = ? AND cip = ? AND dni = ?`, [
      body.email,
      body.cip,
      body.dni,
    ]);

    return person || null;
  }

  async getTableExams(): Promise<any> {
    const exams = await this.databaseService.executeQuery(`SELECT * FROM examenes`);

    return exams || null;
  }

  async getQuestionsSiecopolWithOffset(index: number): Promise<any> {
    const temas = [
      { idTema: 'T00001', limit: 9, offset: 9 * index },
      { idTema: 'T00002', limit: 5, offset: 5 * index },
      { idTema: 'T00003', limit: 9, offset: 9 * index },
      { idTema: 'T00004', limit: 10, offset: 10 * index },
      { idTema: 'T00005', limit: 6, offset: 6 * index },
      { idTema: 'T00006', limit: 2, offset: 2 * index },
      index === 24 ? { idTema: 'T00007', limit: 12, offset: (10 * index) }
        : index >= 25 ? { idTema: 'T00007', limit: 12, offset: (10 * index) + 2 }
          : { idTema: 'T00007', limit: 10, offset: 10 * index },
      { idTema: 'T00008', limit: 5, offset: 5 * index },
      { idTema: 'T00009', limit: 6, offset: 6 * index },
      { idTema: 'T00010', limit: 14, offset: 14 * index },
      { idTema: 'T00011', limit: 3, offset: 3 * index },
      { idTema: 'T00012', limit: 5, offset: 5 * index },
      { idTema: 'T00013', limit: 4, offset: 4 * index },
      index === 24 ? { idTema: 'T00014', limit: 17, offset: (2 * index) }
        : index >= 25 ? { idTema: 'T00014', limit: 17, offset: (2 * index) + 42 }
          : { idTema: 'T00014', limit: 2, offset: 2 * index },
      index >= 25 ? { idTema: 'T00015', limit: 8, offset: 5 * index }
        : { idTema: 'T00015', limit: 5, offset: 5 * index },
      { idTema: 'T00016', limit: 3, offset: 3 * index },
      index === 22 ? { idTema: 'T00017', limit: 5, offset: 1 * index }
        : index === 23 ? { idTema: 'T00017', limit: 14, offset: (1 * index) + 4 }
          : index === 24 ? { idTema: 'T00017', limit: 19, offset: (1 * index) + 17 }
            : index >= 25 ? { idTema: 'T00017', limit: 19, offset: (1 * index) + 36 }
              : { idTema: 'T00017', limit: 1, offset: 1 * index },
      index === 21 ? { idTema: 'T00018', limit: 3, offset: 1 * index }
        : index === 22 ? { idTema: 'T00018', limit: 3, offset: (1 * index) + 2 }
          : index === 23 ? { idTema: 'T00018', limit: 3, offset: (1 * index) + 4 }
            : index === 24 ? { idTema: 'T00018', limit: 3, offset: (1 * index) + 6 }
              : index >= 25 ? { idTema: 'T00018', limit: 5, offset: (1 * index) + 8 }
                : { idTema: 'T00018', limit: 1, offset: 1 * index },
    ];

    // Ejecutar todas las consultas en paralelo
    const queries = temas.map(({ idTema, limit, offset }) =>
      this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idTema = ? 
              ORDER BY CAST(idPregunta AS UNSIGNED) LIMIT ? OFFSET ?`, [idTema, limit, offset])
    );

    // Esperar a que todas las consultas terminen
    const results = await Promise.all(queries);

    // Extraer los IDs de todas las preguntas seleccionadas
    const questionIds = results.flatMap((rows) =>
      rows.map((q: { idPregunta: string }) => q.idPregunta));

    const questionIdsString = questionIds.map(id => `'${id}'`).join(", ");

    // Traer los detalles de esas preguntas y sus respuestas
    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema,
      GROUP_CONCAT(CONCAT(a.idAlternativa, "@", a.alternativa) ORDER BY RAND() SEPARATOR '||') AS options, 
      (SELECT a2.idAlternativa 
          FROM alternativas a2 
          WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
      ) AS correctAnswer 
      FROM preguntas p 
      INNER JOIN alternativas a ON a.idPregunta = p.idPregunta
      INNER JOIN temas t ON t.idTema = p.idTema
      WHERE p.idPregunta IN (${questionIdsString})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`);

    return questions || null;
  }

  async saveIncorrectQuestions(body: { failedQuestions: string[] }): Promise<any> {
    if (body.failedQuestions.length === 0) {
      return { message: 'No questions to save' };
    }

    // Buscar qué preguntas ya existen
    const placeholders = body.failedQuestions.map(() => "?").join(", ");
    const existingRecords = await this.databaseService.executeQuery(
      `SELECT idPregunta FROM preguntasfallidas WHERE idPregunta IN (${placeholders})`,
      body.failedQuestions);

    // Extraer solo las que no existen
    const existingIds = new Set(existingRecords.map((q: { idPregunta: string }) => q.idPregunta));
    const newQuestions = body.failedQuestions.filter(id => !existingIds.has(id));

    console.log("newQuestions", newQuestions)
    if (newQuestions.length === 0) {
      return { message: 'No new questions to save' };
    }

    // Insertar solo las nuevas
    const newPlaceholders = newQuestions.map(() => "(?)").join(", ");
    await this.databaseService.executeQuery(
      `INSERT INTO preguntasfallidas (idPregunta) VALUES ${newPlaceholders}`,
      newQuestions
    );

    return { message: 'OK' };
  }

  async getIncorrectQuestions(quantity: number): Promise<any> {

    const randomQuestions = await this.databaseService.executeQuery(`
      SELECT idPregunta FROM preguntasfallidas ORDER BY RAND() LIMIT ?;
      `, [quantity]);

    const questionIds = randomQuestions.map((q: { idPregunta: string }) => q.idPregunta);
    if (questionIds.length === 0) {
      return []; // Retorna un array vacío si no hay preguntas
    }

    const newPlaceholders = questionIds.map(() => "?").join(", ");
    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema,
      GROUP_CONCAT(CONCAT(a.idAlternativa, "@", a.alternativa) ORDER BY RAND() SEPARATOR '||') AS options, 
      (SELECT a2.idAlternativa 
          FROM alternativas a2 
          WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
      ) AS correctAnswer 
      FROM preguntas p 
      INNER JOIN alternativas a ON a.idPregunta = p.idPregunta
      INNER JOIN temas t ON t.idTema = p.idTema
      WHERE p.idPregunta IN (${newPlaceholders})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`, questionIds);
    return questions
  }

  async getQuantityQuestions(tableName: string): Promise<any> {
    const quantity = await this.databaseService.executeQuery(`SELECT COUNT(*) AS quantity FROM ${tableName}`);
    // Validar que el resultado tenga datos y extraer la cantidad
    if (Array.isArray(quantity) && quantity.length > 0 && quantity[0]?.quantity !== undefined) {
      return quantity[0].quantity;
    }

    console.warn(`Tabla "${tableName}" no encontrada o sin registros.`);
    return null;
  }
}
