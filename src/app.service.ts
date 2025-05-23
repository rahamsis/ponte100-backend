import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { BodyDto, CrudQuestionsDto, IncorrectQuestionsDto, QuantityQuestionsDto, SessionDto, SessionTokenDto, UpdateProfileUserDto, UpdateUserDeleteVerification, ValidatePersonDto, VerificationTokenDto } from './dto/body.dto';
import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {

  constructor(private readonly databaseService: DatabaseService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async getLogin(body: BodyDto): Promise<{ message: string }> {
    const user = await this.databaseService.executeQuery(`SELECT u.userId, u.username, u.email, u.cip, 
      u.password, u. dni, u.verified, s.userIp, s.userDevice, u.profile
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

    await this.databaseService.executeQuery(`INSERT INTO users (userId, username, email, password, fechaCreacion)
        VALUES (?,?,?,?,NOW())`, [
      uuidv4(),
      body.username,
      email,
      hashedPassword
    ]);

    return { message: "Cuenta creada exitosamente" }
  }

  async createSession(body: SessionDto): Promise<{ sessionId: string }> {
    await this.databaseService.executeQuery(`DELETE FROM sessions WHERE userId = ?`, [body.userId]);

    const sessionId = uuidv4();
    const formattedExpires = new Date(body.sessionExpires).toISOString().slice(0, 19).replace("T", " ");

    await this.databaseService.executeQuery(`INSERT INTO sessions (sessionId, userId, userDevice, userIp, sessionToken, sessionExpires, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [sessionId, body.userId, body.userDevice, body.userIp, body.sessionToken, formattedExpires]);

    return { sessionId: sessionId };
  }

  async activeSession(body: SessionTokenDto): Promise<any> {
    const session = await this.databaseService.executeQuery(`SELECT * FROM sessions 
            WHERE sessionToken = ? AND sessionExpires > NOW()
            ORDER BY createdAt DESC LIMIT 1`, [body.sessionToken]);

    return session || null;
  }

  async getTemas(): Promise<any> {
    const temas = await this.databaseService.executeQuery(`SELECT * FROM temas`);

    return temas || null;
  }

  async getQuestionsByIdTema(idTema: string, limit: number): Promise<any> {
    const results = await this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idTema = ? 
      ORDER BY RAND() LIMIT ?`, [idTema, limit.toString()])

    const questionIds = results.map((q: { idPregunta: string }) => q.idPregunta);

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema,
            GROUP_CONCAT(CONCAT(a.idAlternativa,"@", a.alternativa) ORDER BY a.idAlternativa SEPARATOR '||') AS options, 
            (SELECT a2.idAlternativa 
                FROM alternativas a2 
                WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
            ) AS correctAnswer 
            FROM preguntas p 
            INNER JOIN alternativas a ON a.idPregunta = p.idPregunta 
            INNER JOIN temas t ON t.idTema = p.idTema
            WHERE p.idPregunta IN (${placeholders})
            GROUP BY p.idPregunta`, questionIds);

    return questions || null;
  }

  async getQuestionsHabilidades(idTema: string, limit: number): Promise<any> {
    const results = await this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idTema = ? 
      ORDER BY CAST(idPregunta AS UNSIGNED) LIMIT ?`, [idTema, limit.toString()])

    const questionIds = results.map((q: { idPregunta: string }) => q.idPregunta);

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema,
            GROUP_CONCAT(CONCAT(a.idAlternativa,"@", a.alternativa) ORDER BY a.idAlternativa SEPARATOR '||') AS options, 
            (SELECT a2.idAlternativa 
                FROM alternativas a2 
                WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
            ) AS correctAnswer 
            FROM preguntas p 
            INNER JOIN alternativas a ON a.idPregunta = p.idPregunta 
            INNER JOIN temas t ON t.idTema = p.idTema
            WHERE p.idPregunta IN (${placeholders})
            GROUP BY p.idPregunta`, questionIds);

    return questions || null;
  }

  async getQuestionsAndAnswer(idTema: string): Promise<any> {
    const results = await this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idTema = ? 
      ORDER BY CAST(idPregunta AS UNSIGNED)`, [idTema])

    const questionIds = results.map((q: { idPregunta: string }) => q.idPregunta);

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema, 
        GROUP_CONCAT(CONCAT(pc.palabra) SEPARATOR ',') AS claves,
            (SELECT a2.alternativa 
                FROM alternativas a2 
                WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
            ) AS correctAnswer 
            FROM preguntas p 
            INNER JOIN alternativas a ON a.idPregunta = p.idPregunta 
            INNER JOIN temas t ON t.idTema = p.idTema
            LEFT JOIN palabrasclaves pc on pc.idPregunta = p.idPregunta
            WHERE p.idPregunta IN (${placeholders})
            GROUP BY p.idPregunta`, questionIds);

    return questions || null;
  }

  async getQuestionsRamdonWithLimit(limite: number): Promise<any> {
    let questionIds: string[] = [];
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
              ORDER BY RAND() LIMIT ?`, [idTema, limit.toString()])
      );

      // Esperar a que todas las consultas terminen
      const results = await Promise.all(queries);

      // Extraer los IDs de todas las preguntas seleccionadas
      questionIds = results.flatMap((rows) =>
        rows.map((q: { idPregunta: string }) => q.idPregunta));

    } else {
      // Obtener preguntas aleatorias de manera eficiente, según la cantidad solicitada
      const randomQuestions = await this.databaseService.executeQuery(`
        SELECT idPregunta FROM preguntas ORDER BY RAND() LIMIT ?`, [limite.toString()]);
      questionIds = randomQuestions.map((q: { idPregunta: string }) => q.idPregunta);
    }

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

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
      WHERE p.idPregunta IN (${placeholders})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`, questionIds);

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
        ORDER BY RAND() LIMIT ?`, [idTema, limit.toString()])
    );

    // Esperar a que todas las consultas terminen
    const results = await Promise.all(queries);

    // Extraer los IDs de todas las preguntas seleccionadas
    const questionIds = results.flatMap((rows) =>
      rows.map((q: { idPregunta: string }) => q.idPregunta));

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

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
      WHERE p.idPregunta IN (${placeholders})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`, questionIds);

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
    const idExamen = index < 9 ? 'EXAM0000' + (index + 1) : 'EXAM000' + (index + 1);

    const results = await this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idExamen = ? 
            ORDER BY CAST(idPregunta AS UNSIGNED)`, [idExamen]);

    const questionIds = results.map((q: { idPregunta: string }) => q.idPregunta);

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

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
      WHERE p.idPregunta IN (${placeholders})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`, questionIds);

    return questions || null;
  }

  async saveIncorrectQuestions(body: CrudQuestionsDto): Promise<any> {
    if (body.correctQuestionsIds.length === 0) {
      return { message: 'No questions to save' };
    }

    // Buscar qué preguntas ya existen
    const placeholders = body.correctQuestionsIds.map(() => "?").join(", ");
    const existingRecords = await this.databaseService.executeQuery(
      `SELECT idPregunta FROM preguntasfallidas WHERE idPregunta IN (${placeholders})`,
      body.correctQuestionsIds);

    // Extraer solo las que no existen
    const existingIds = new Set(existingRecords.map((q: { idPregunta: string }) => q.idPregunta));
    const newQuestions = body.correctQuestionsIds.filter(id => !existingIds.has(id));

    if (newQuestions.length === 0) {
      return { message: 'No new questions to save' };
    }

    // Insertar solo las nuevas
    const newPlaceholders = newQuestions.map(() => "(?, ?)").join(", ");
    const values = newQuestions.flatMap(id => [id, body.userId]);

    await this.databaseService.executeQuery(
      `INSERT INTO preguntasfallidas (idPregunta, idUsuario) VALUES ${newPlaceholders}`,
      values
    );

    return { message: 'OK' };
  }

  async getIncorrectQuestions(body: IncorrectQuestionsDto): Promise<any> {

    const randomQuestions = await this.databaseService.executeQuery(`
      SELECT idPregunta FROM preguntasfallidas where intentos > 0 AND idUsuario = ? ORDER BY RAND() LIMIT ?;
      `, [body.userId, body.quantity.toString()]);

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
      ) AS correctAnswer,
       f.intentos
      FROM preguntas p 
      INNER JOIN alternativas a ON a.idPregunta = p.idPregunta
      INNER JOIN temas t ON t.idTema = p.idTema
      LEFT JOIN preguntasfallidas f ON f.idPregunta = p.idPregunta
      WHERE p.idPregunta IN (${newPlaceholders})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`, questionIds);
    return questions
  }

  async getQuantityQuestions(body: QuantityQuestionsDto): Promise<any> {
    let quantity = 0

    if (body.tableName === "preguntasfallidas") {
      quantity = await this.databaseService.executeQuery(`SELECT COUNT(*) AS quantity FROM ${body.tableName} 
        WHERE INTENTOS > 0 and idUsuario = ?`, [body.userId]);
    } else {
      quantity = await this.databaseService.executeQuery(`SELECT COUNT(*) AS quantity FROM ${body.tableName}`);
    }
    // Validar que el resultado tenga datos y extraer la cantidad
    if (Array.isArray(quantity) && quantity.length > 0 && quantity[0]?.quantity !== undefined) {
      return quantity[0].quantity;
    }

    console.warn(`Tabla "${body.tableName}" no encontrada o sin registros.`);
    return null;
  }

  async updateIncorrectQuestions(body: CrudQuestionsDto): Promise<any> {
    if (body.correctQuestionsIds.length === 0 && body.incorrectQuestionIds.length === 0) {
      return { message: 'No questions to update' };
    }

    let updatedCount = 0;
    // 1. Buscar las preguntas en `correctQuestionsId` que existen y tienen intentos > 0
    if (body.correctQuestionsIds.length > 0) {
      const placeholders = body.correctQuestionsIds.map(() => "?").join(", ");
      const existingRecords = await this.databaseService.executeQuery(
        `SELECT idPregunta, intentos FROM preguntasfallidas 
          WHERE idUsuario = ? AND idPregunta IN (${placeholders}) AND intentos > 0`,
        [body.userId, ...body.correctQuestionsIds]
      );

      if (existingRecords.length > 0) {
        // Actualizar el campo intentos restándole 1
        const updatePromises = existingRecords.map((record: { idPregunta: string; intentos: number }) =>
          this.databaseService.executeQuery(
            `UPDATE preguntasfallidas SET intentos = ? WHERE idUsuario = ? AND idPregunta = ?`,
            [(record.intentos - 1).toString(), body.userId, record.idPregunta]
          )
        );

        await Promise.all(updatePromises);
        updatedCount += existingRecords.length;
      }
    }

    // 2. Buscar las preguntas en `incorrectQuestionIds` que existen con el mismo userId
    if (body.incorrectQuestionIds.length > 0) {
      const incorrectPlaceholders = body.incorrectQuestionIds.map(() => "?").join(", ");
      const existingIncorrectRecords = await this.databaseService.executeQuery(
        `SELECT idPregunta FROM preguntasfallidas WHERE idUsuario = ? AND idPregunta IN (${incorrectPlaceholders})`,
        [body.userId, ...body.incorrectQuestionIds]
      );

      if (existingIncorrectRecords.length > 0) {
        const updateIncorrectPromises = existingIncorrectRecords.map((record: { idPregunta: string }) =>
          this.databaseService.executeQuery(
            `UPDATE preguntasfallidas SET intentos = 2 WHERE idUsuario = ? AND idPregunta = ?`,
            [body.userId, record.idPregunta]
          )
        );

        await Promise.all(updateIncorrectPromises);
        updatedCount += existingIncorrectRecords.length;
      }
    }

    return { message: `${updatedCount} questions updated successfully` };
  }

  async saveVerificationToken(body: VerificationTokenDto): Promise<any> {
    const expires = new Date(body.expires).toISOString().slice(0, 19).replace("T", " "); //expira en 24 horas

    const response = await this.databaseService.executeQuery(`SELECT * FROM emailverifications where userId = ?`, [body.userId]);
    if (!response || response.length === 0) {
      await this.databaseService.executeQuery(`INSERT INTO emailverifications (userId, token, expiresAt)
        VALUES( ?, ?, ?)`, [body.userId, body.token, expires]);

      return { message: "Datos de emailverifications creados correctamente" }
    } else {
      await this.databaseService.executeQuery(`UPDATE emailverifications SET token = ?, expiresAt = ?
        WHERE userId = ?`, [body.token, expires, body.userId]);

      return { message: "Datos de emailverifications actualizados correctamente" }
    }
  }

  async getEmailVeification(body: SessionTokenDto): Promise<any> {
    const session = await this.databaseService.executeQuery(`SELECT * FROM emailverifications 
            WHERE token = ? AND expiresAt > NOW()`, [body.sessionToken]);

    return session || null;
  }

  async updateUserDeleteVerification(body: UpdateUserDeleteVerification): Promise<any> {
    // 1. borrar el verification email
    await this.databaseService.executeQuery(
      `DELETE FROM emailverifications WHERE userId = ?`, [body.userId]
    );

    // 2. Actualizar el usuario
    await this.databaseService.executeQuery(
      `UPDATE users SET verified = true WHERE userId = ? `, [body.userId]
    );

    return { message: "Datos de usuario actualizados correctamente" }
  }

  async getProfileuser(body: UpdateProfileUserDto): Promise<any> {
    const user = await this.databaseService.executeQuery(
      `SELECT * FROM users WHERE userId = ?`,
      [body.userId]
    );

    return user || null;
  }

  async updateProfileuser(body: UpdateProfileUserDto): Promise<any> {

    const password = body.password?.trim();
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const formattedDate = body.fechaNacimiento ? new Date(body.fechaNacimiento).toISOString().split("T")[0] : null;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Recorremos cada propiedad del objeto body
    Object.keys(body).forEach((key) => {
      const value = body[key as keyof UpdateProfileUserDto];

      // Si el valor no es nulo, vacío o indefinido, lo agregamos a la consulta
      if (value !== null && value !== undefined && value !== "") {
        // Omitimos el campo userId directamente
        if (key === "userId") {
          return;
        }

        // Si es la contraseña, usamos el hash
        if (key === "password" && hashedPassword) {
          updateFields.push("password = ?");
          updateValues.push(hashedPassword);
        } else if (key === "fechaNacimiento" && formattedDate) {
          updateFields.push("fechaNacimiento = ?");
          updateValues.push(formattedDate);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
    });

    // Siempre actualizamos la fecha
    updateFields.push("fechaActualizacion = NOW()");

    // Agregamos el ID del usuario al final
    updateValues.push(body.userId);

    // Construimos la consulta dinámica
    const sql = `
        UPDATE users 
        SET ${updateFields.join(", ")} 
        WHERE userId = ?
    `;

    await this.databaseService.executeQuery(sql, updateValues);

    return { message: "Usuario actualizado correctamente" };
  }

  async getQuestionsToTaller(body: any): Promise<any> {
    const idExamen = body.index < 9 ? 'EXAM0000' + (body.index + 1) : 'EXAM000' + (body.index + 1);

    const results = await this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idExamen = ? 
            ORDER BY idTema, CAST(idPregunta AS UNSIGNED) LIMIT ? OFFSET ?`,
      [idExamen, body.limit.toString(), body.offset.toString()]);

    const questionIds = results.map((q: { idPregunta: string }) => q.idPregunta);

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

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
      WHERE p.idPregunta IN (${placeholders})
      GROUP BY p.idPregunta
      ORDER BY p.idTema`, questionIds);

    return questions || null;
  }
}