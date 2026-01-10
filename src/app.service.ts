import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import {
  BodyDto, CrudProgress, CrudQuestionsDto, CrudUsuario, CrudUsuarioTalleres, IncorrectQuestionsDto,
  ProgressResultDto, SessionDto, SessionTokenDto, UpdateProfileUserDto,
  UpdateUserDeleteVerification, ValidatePersonDto, VerificationTokenDto
} from './dto/body.dto';
import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'bcrypt';
import { Util } from './util/util';

@Injectable()
export class AppService {

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly util: Util
  ) { }

  async getLogin(body: BodyDto): Promise<{ user: any }> {

    const user = await this.databaseService.executeQuery(`SELECT u.userId, u.username, u.email, u.cip, 
      u.password, u. dni, u.verified, s.userIp, s.userDevice, u.profile, u.welcome, u.idPerfil
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
      throw new Error('Credenciales inválidas.');
    }

    const menu = await this.databaseService.executeQuery(`SELECT m.idMenu, m.nombre, m.ruta, m.otrasRutas,
      pm.estado, m.icon, sm.idSubmenu, sm.nombre AS nombreSubmenu, sm.ruta AS rutaSubmenu, sm.icon AS iconSubmenu
      FROM perfilmenu as pm 
      INNER JOIN perfil as p on p.idPerfil = pm.idPerfil
      INNER JOIN menu as m on m.idMenu = pm.idMenu
      LEFT JOIN submenu as sm on sm.idMenu = m.idMenu
      WHERE p.idPerfil = ?
      ORDER BY m.orden, sm.orden`, [user[0].idPerfil]);

    return {
      user: {
        ...user[0],
        menu
      }
    };
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

  async getGrados(): Promise<any> {
    const grados = await this.databaseService.executeQuery(`SELECT * FROM grados
            ORDER BY idGrado ASC`);

    return grados || null;
  }

  async getGradoById(id: string): Promise<any> {
    const grado = await this.databaseService.executeQuery(`SELECT * FROM grados 
      WHERE idGrado = ? ORDER BY idGrado ASC`, [id]);

    return grado || null;
  }

  async updateUserGrado(idGrado: string, userId: string): Promise<any> {
    const result = await this.databaseService.executeQuery(`UPDATE users 
      SET idGradoObjetivo = ?, welcome = 1, fechaActualizacion = NOW()
      WHERE userId = ?`, [idGrado, userId]);

    return result || null;
  }

  async getMainMenu(): Promise<any> {
    const result = await this.databaseService.executeQuery(`SELECT * FROM menu
            ORDER BY idMenu ASC`);

    return result || null;
  }

  async getTemas(): Promise<any> {
    const temas = await this.databaseService.executeQuery(`select t.idTema, t.tema, count(*) as quantity from temas t 
      INNER JOIN preguntas p on p.idTema = t.idTema
      GROUP by p.idTema ORDER BY p.idTema`);

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

  async getQuestionsSiecopolExamNoRepeat(idExamen: string): Promise<any> {

    const results = await this.databaseService.executeQuery(`SELECT idPregunta 
      FROM preguntas WHERE idExamen = ? 
      ORDER BY idExamen, idTema, CAST(idPregunta AS UNSIGNED)`, [idExamen]);

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
      ORDER BY p.idExamen, p.idTema, CAST(p.idPregunta AS UNSIGNED)`, questionIds);

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

  async updateProfileuser(body: UpdateProfileUserDto): Promise<{ ok: boolean; message?: string }> {
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

    return { ok: true, message: "Usuario actualizado correctamente" };
  }

  async gettalleresByUserId(userId: string): Promise<any> {
    const talleres = await this.databaseService.executeQuery(`SELECT t.idTaller, t.nombreTaller, c.idClase, c.nombreClase, s.idSesion, s.nombreSesion, s.indice, s.limite, s.salto, COALESCE(ut.activo, 0) AS activo
      FROM taller t
      LEFT JOIN usuariotalleres ut on t.idTaller = ut.idTaller and ut.idUsuario = ?
      LEFT JOIN clase c on c.idTaller = t.idTaller
      LEFT JOIN sesion s on s.idClase = c.idClase
      ORDER BY t.idTaller, c.idClase, s.idSesion;`, [userId]);

    const talleresMap = new Map();

    for (const row of talleres) {
      const {
        idTaller,
        nombreTaller,
        idClase,
        nombreClase,
        idSesion,
        nombreSesion,
        indice,
        limite,
        salto,
        activo
      } = row;

      // 🧱 Taller
      if (!talleresMap.has(idTaller)) {
        talleresMap.set(idTaller, {
          idTaller,
          nombre: nombreTaller,
          tallerActivo: activo ?? 0,
          clases: [],
        });
      }

      const taller = talleresMap.get(idTaller);

      // 🧱 Clase
      let clase = taller.clases.find(c => c.idClase === idClase);
      if (!clase) {
        clase = {
          idClase,
          nombre: nombreClase,
          sesiones: [],
        };
        taller.clases.push(clase);
      }

      // 🧱 Sesión
      clase.sesiones.push({
        nombre: nombreSesion,
        indice: indice,
        limit: limite,
        offset: salto,
      });
    }

    return Array.from(talleresMap.values());
  }

  async getQuestionsToTaller(body: any): Promise<any> {
    const idExamen = body.index <= 9 ? 'EXAM0000' + body.index : 'EXAM000' + body.index;

    const results = await this.databaseService.executeQuery(`SELECT idPregunta 
      FROM preguntas WHERE idExamen = ? 
      ORDER BY idExamen, idTema, CAST(idPregunta AS UNSIGNED) LIMIT ? OFFSET ?`,
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
      ORDER BY p.idExamen, p.idTema, CAST(p.idPregunta AS UNSIGNED)`, questionIds);

    return questions || null;
  }

  async getQuestionsToDownloadToClase(idClase: string): Promise<any> {

    const soloNumeros = idClase.replace(/\D/g, "");
    const idExamen = 'EXAM0' + (soloNumeros);
    const results = await this.databaseService.executeQuery(`SELECT idPregunta FROM preguntas WHERE idExamen = ? 
            ORDER BY idExamen, idTema, CAST(idPregunta AS UNSIGNED)`,
      [idExamen]);

    const questionIds = results.map((q: { idPregunta: string }) => q.idPregunta);

    // Crear placeholders seguros para evitar inyección SQL
    const placeholders = questionIds.map(() => "?").join(", ");

    // const questions = await this.databaseService.executeQuery(`
    //   SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema, p.ubicacion,
    //   GROUP_CONCAT(CONCAT(a.idAlternativa, "@", a.alternativa) ORDER BY RAND() SEPARATOR '||') AS options, 
    //   (SELECT a2.idAlternativa 
    //       FROM alternativas a2 
    //       WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
    //   ) AS correctAnswer 
    //   FROM preguntas p 
    //   INNER JOIN alternativas a ON a.idPregunta = p.idPregunta
    //   INNER JOIN temas t ON t.idTema = p.idTema
    //   WHERE p.idPregunta IN (${placeholders})
    //   GROUP BY p.idPregunta
    //   ORDER BY p.idExamen, p.idTema, CAST(p.idPregunta AS UNSIGNED)`, questionIds);

    const questions = await this.databaseService.executeQuery(`
      SELECT p.idPregunta AS id, p.pregunta AS question, p.idTema, t.tema, p.ubicacion,
      GROUP_CONCAT(CONCAT(a.idAlternativa, "@", a.alternativa) ORDER BY RAND() SEPARATOR '||') AS options, 
      (SELECT a2.idAlternativa 
          FROM alternativas a2 
          WHERE a2.idPregunta = p.idPregunta AND a2.respuesta = 1 LIMIT 1
      ) AS correctAnswer,
      pc.clave 
      FROM preguntas p 
      INNER JOIN alternativas a ON a.idPregunta = p.idPregunta
      INNER JOIN temas t ON t.idTema = p.idTema
      LEFT JOIN (
        SELECT idPregunta, GROUP_CONCAT(palabra SEPARATOR '||') AS clave 
        FROM palabrasclaves 
        GROUP BY idPregunta
      ) pc ON pc.idPregunta = p.idPregunta
      WHERE p.idPregunta IN (${placeholders})
      GROUP BY p.idPregunta
      ORDER BY p.idExamen, p.idTema, CAST(p.idPregunta AS UNSIGNED)`, questionIds)

    return questions || null;
  }

  async getProgressResult(body: ProgressResultDto): Promise<any> {

    // las incorrectas lo saco de la cantidad de la tabla fallidas ya que no hay forma de 
    // reducir las incorrectas en la tabla progreso
    const result = await this.databaseService.executeQuery(`SELECT idProgreso, idUsuario, tipoExamen, 
      timer, intentos, totalPreguntas, correctas, nulas, createdDate, 
      updatedDate FROM progreso WHERE idUsuario = ?`, [body.userId]);

    return result || null;
  }

  async getQuantiyFallidasByUserId(userId: string): Promise<any> {
    const cantidadFallidas = await this.databaseService.executeQuery(`select count(*) as cantidadFallidas
      from preguntasfallidas where idUsuario = ? and intentos > 0`, [userId]);

    return cantidadFallidas || null;
  }

  async saveOrUpdateProgress(body: CrudProgress): Promise<any> {
    if (!body.idUsuario || body.idUsuario.length === 0) {
      return { message: 'No progress to save' };
    }

    // Buscar qué progreso ya existen
    const existingRecords = await this.databaseService.executeQuery(
      `SELECT * FROM progreso WHERE idUsuario = ? and tipoExamen = ?`,
      [body.idUsuario, body.tipoExamen]);

    if (existingRecords.length > 0) {
      const existing = existingRecords[0];

      // Sumar los valores con los existentes
      const newTimer = existing.timer + body.timer;
      const newIntentos = existing.intentos + 1;
      const newTotalPreguntas = existing.totalPreguntas + body.totalPreguntas;
      const newCorrectas = existing.correctas + body.correctas;
      const newIncorrectas = existing.incorrectas + body.incorrectas;
      const newNulas = existing.nulas + body.nulas;

      // Actualizar el progreso existente
      const result = await this.databaseService.executeQuery(
        `UPDATE progreso 
        SET timer = ?, intentos = ?, totalPreguntas = ?, correctas = ?, incorrectas = ?, nulas = ?, updatedDate = NOW() 
        WHERE idProgreso = ?`,
        [newTimer, newIntentos, newTotalPreguntas, newCorrectas, newIncorrectas, newNulas, existing.idProgreso]
      );

      return { message: 'Progress updated successfully', idProgreso: existing.idProgreso };
    } else {
      const idProgreso = uuidv4();

      // Insertar nuevo progreso
      const result = await this.databaseService.executeQuery(
        `INSERT INTO progreso (idProgreso, idUsuario, tipoExamen, timer, intentos, totalPreguntas, correctas, incorrectas, nulas, createdDate, updatedDate)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, NOW(), NOW())`,
        [idProgreso, body.idUsuario, body.tipoExamen, body.timer, body.totalPreguntas, body.correctas, body.incorrectas, body.nulas]
      );

      return { message: 'Progress saved successfully', idProgreso: result.insertId };
    }
  }

  async getGradoObjetivoByUserId(userId: string): Promise<any> {
    const grado = await this.databaseService.executeQuery(`SELECT g.idGrado, g.nombreGrado, g.imagen FROM users u
      INNER JOIN grados g on g.idGrado = u.idGradoObjetivo
      WHERE u.userId = ?`, [userId]);

    return grado || null;
  }

  async getAllUsers(): Promise<any> {
    const users = await this.databaseService.executeQuery(`SELECT u.userId, u.nombre, u.apellidos, u.genero, 
      u.idGrado, g.nombreGrado, u.email, u.telefono, u.cip, u.dni, u.username, u.idPerfil, p.nombrePerfil
      FROM users u
      LEFT JOIN grados g on g.idGrado = u.idGrado
      LEFT JOIN perfil p ON p.idPerfil = u.idPerfil;`,);

    return users || null;
  }

  async getAllTalleres(): Promise<any> {
    const talleres = await this.databaseService.executeQuery(`SELECT idTaller, nombreTaller FROM taller`);

    return talleres || null;
  }

  async getAllTalleresByUserId(userId: string): Promise<any> {
    const response = await this.databaseService.executeQuery(`SELECT idUsuario, idTaller, activo 
      FROM usuariotalleres
      WHERE idUsuario = ? and activo = 1`, [userId]);

    return response || null;
  }

  async saveOrUpdateTallerToOneUser(body: CrudUsuarioTalleres): Promise<any> {
    if (body.userId.length === 0) {
      return { message: 'No userId for taller to save' };
    }

    for (const dato of body.datos) {
      const { idTaller, estado } = dato;
      const existingRecords = await this.databaseService.executeQuery(
        `SELECT * FROM usuariotalleres WHERE idUsuario = ? AND idTaller = ?`,
        [body.userId, idTaller]
      );

      if (existingRecords.length > 0) {
        // Ya existe: actualiza el registro
        await this.databaseService.executeQuery(
          `UPDATE usuariotalleres
          SET activo = ?, idUsuarioRegistro = ?, updatedDate = NOW()
          WHERE idUsuario = ? AND idTaller = ?`,
          [estado, body.idUsuarioregistro, body.userId, idTaller]
        );
      } else {
        // No existe: inserta nuevo registro
        await this.databaseService.executeQuery(
          `INSERT INTO usuariotalleres (idUsuario, idTaller, activo, idUsuarioRegistro, createdDate, updatedDate)
          VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [body.userId, idTaller, estado, body.idUsuarioregistro]
        );
      }
    }

    return { message: 'usuarioTalleres procesado correctamente' };

  }

  async registerUser(body: CrudUsuario): Promise<any> {
    // Buscar qué progreso ya existen
    const existingRecords = await this.databaseService.executeQuery(
      `SELECT * FROM users WHERE email = ?`,
      [body.email]);

    if (existingRecords.length > 0) {
      // return { message: 'existe usuario registrado con correo: ' + body.email };
      throw new Error('existe usuario registrado con correo: ' + body.email);
    } else {
      const idUsuario = uuidv4()
      const passwordHashed = await bcrypt.hash(body.password, 10)

      // Insertar nuevo progreso
      const result = await this.databaseService.executeQuery(
        `INSERT INTO users (userId, nombre, apellidos, genero, idGrado, email, telefono, password,
        cip, dni, verified, username, welcome, fechaCreacion, fechaActualizacion, idPerfil)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, NOW(), NOW(), 'PF0003')`,
        [idUsuario,
          body.nombre,
          body.apellidos,
          body.genero,
          body.idGrado,
          body.email,
          body.telefono,
          passwordHashed,
          body.cip,
          body.dni,
          body.username]
      );

      return { ok: true };
    }
  }

  async resetPassword(body: { password: string, userId: string }): Promise<any> {

    const passwordHashed = await bcrypt.hash(body.password, 10)

    // Insertar nuevo progreso
    const result = await this.databaseService.executeQuery(
      `UPDATE users set password = ?, fechaActualizacion = NOW()
        WHERE userId = ?`,
      [passwordHashed, body.userId]);

    return { ok: true };
  }

  async getCompleteQuestionById(idPregunta: string) {
    const response = await this.databaseService.executeQuery(`
    SELECT JSON_OBJECT(
      'idPregunta', p.idPregunta,
      'pregunta', p.pregunta,
      'alternativas', (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'idAlternativa', a.idAlternativa,
            'alternativa', a.alternativa,
            'respuesta', a.respuesta
          )
        )
        FROM alternativas a
        WHERE a.idPregunta = p.idPregunta
      ),
      'claves', (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'idPalabra', pc.idPalabra,
            'palabra', pc.palabra
          )
        )
        FROM palabrasclaves pc
        WHERE pc.idPregunta = p.idPregunta
      )
    ) AS data
    FROM preguntas p
    WHERE p.idPregunta = ?;`, [idPregunta]);

    return response || null;
  }

  async updatePregunta(body: { idPregunta: string, pregunta: string }): Promise<{ ok: boolean }> {
    const result = await this.databaseService.executeQuery(
      `UPDATE preguntas set pregunta = ?
        WHERE idPregunta = ?`,
      [body.pregunta, body.idPregunta]);

    return { ok: result.affectedRows > 0 };
  }

  async updateAlternativa(body: { idAlternativa: string, alternativa: string }): Promise<{ ok: boolean }> {
    const result = await this.databaseService.executeQuery(
      `UPDATE alternativas set alternativa = ?
        WHERE idAlternativa = ?`,
      [body.alternativa, body.idAlternativa]);

    return { ok: result.affectedRows > 0 };
  }

  async updateClave(body: { idPalabra: string, palabra: string }): Promise<{ ok: boolean }> {
    const result = await this.databaseService.executeQuery(
      `UPDATE palabrasclaves set palabra = ?
        WHERE idPalabra = ?`,
      [body.palabra, body.idPalabra]);

    return { ok: result.affectedRows > 0 };
  }

  async getAllDataQuestions(filtro: string): Promise<any> {
    const result = await this.databaseService.executeQuery(
      `SELECT 
        p.pregunta, 
        MAX(CASE WHEN a_orden.row_num = 1 THEN a_orden.alternativa END) AS alternativa_a,
        MAX(CASE WHEN a_orden.row_num = 2 THEN a_orden.alternativa END) AS alternativa_b,
        MAX(CASE WHEN a_orden.row_num = 3 THEN a_orden.alternativa END) AS alternativa_c,
        MAX(CASE WHEN a_orden.row_num = 4 THEN a_orden.alternativa END) AS alternativa_d,
        MAX(CASE WHEN a_orden.row_num = 5 THEN a_orden.alternativa END) AS alternativa_e,
        
        MAX(CASE WHEN a_orden.respuesta = 1 THEN a_orden.alternativa END) AS respuesta,
        
        MAX(CASE WHEN pc_orden.row_num = 1 THEN pc_orden.palabra END) AS clave_pregunta,
        MAX(CASE WHEN pc_orden.row_num = 2 THEN pc_orden.palabra END) AS clave_respuesta,

        p.idPregunta AS codigo,
        p.ubicacion,
        t.tema as asignatura
      FROM preguntas p
      INNER JOIN temas t ON t.idTema = p.idTema
      INNER JOIN (
        SELECT 
          a.*,
          ROW_NUMBER() OVER (PARTITION BY a.idPregunta ORDER BY a.idAlternativa) AS row_num
        FROM alternativas a
      ) a_orden ON a_orden.idPregunta = p.idPregunta
      INNER JOIN (
        SELECT
          pc.*,
          ROW_NUMBER() OVER (PARTITION BY pc.idPregunta ORDER BY pc.idPalabra) AS row_num
        FROM palabrasclaves pc
      ) pc_orden ON pc_orden.idPregunta = p.idPregunta
      WHERE 
        (
          (CAST(? AS CHAR) REGEXP '^[0-9]+$' AND p.idPregunta = ?)
          OR
          (CAST(? AS CHAR) NOT REGEXP '^[0-9]+$' AND (
            p.pregunta LIKE CONCAT('%', ?, '%') 
            OR pc_orden.palabra LIKE CONCAT('%', ?, '%')
            OR t.tema LIKE CONCAT('%', ?, '%'))
          )
        )
      GROUP BY p.idPregunta, p.pregunta, p.ubicacion, t.tema;`,
      [filtro, filtro, filtro, filtro, filtro, filtro]);

    return result || null;
  }

  async getAllPerfiles(): Promise<any> {
    const result = await this.databaseService.executeQuery(
      `SELECT idPerfil, nombrePerfil, createdDate, updatedDate
      FROM perfil`, []
    );
    return result || null;
  }

  async createPerfil(body: { nombrePerfil: string }): Promise<{ ok: boolean; message?: string }> {
    const perfil = await this.databaseService.executeQuery(
      `SELECT idPerfil FROM perfil WHERE LOWER(nombrePerfil) = ?`, [
      body.nombrePerfil.toLowerCase(),
    ]);

    if (perfil.length > 0) {
      return {
        ok: false,
        message: "El nombre de perfil ya está en uso."
      };
    }

    const row = await this.databaseService.executeQuery(
      `SELECT idPerfil FROM perfil ORDER BY idPerfil DESC limit 1;`, [
      body.nombrePerfil,
    ]);
    const lastIdPerfil = row.length > 0 ? row[0].idPerfil : "PF0000";
    const idPerfil = this.util.nextCode(lastIdPerfil);

    const result = await this.databaseService.executeQuery(
      `INSERT INTO perfil (idPerfil, nombrePerfil, createdDate, updatedDate)
        VALUES (?, ?, NOW(), NOW())`,
      [idPerfil, body.nombrePerfil]);
    return { ok: result.affectedRows > 0 };
  }

  async updatePerfil(idPerfil: string, body: { nombrePerfil: string }): Promise<{ ok: boolean; message?: string }> {
    const perfil = await this.databaseService.executeQuery(
      `SELECT idPerfil FROM perfil WHERE LOWER(nombrePerfil) = ? ORDER BY idPerfil DESC limit 1;`, [
      body.nombrePerfil.toLowerCase(),
    ]);

    if (idPerfil == "PF0001") {
      return {
        ok: false,
        message: "No se puede editar el perfil, contacte con el administrador del sistema."
      };
    }


    if (perfil.length > 0) {
      return {
        ok: false,
        message: "El nombre de perfil ya está en uso."
      };
    }

    const result = await this.databaseService.executeQuery(
      `UPDATE perfil SET nombrePerfil = ?, updatedDate = NOW()
        WHERE idPerfil = ?`,
      [body.nombrePerfil, idPerfil]);
    return { ok: result.affectedRows > 0 };
  }

  async deletePerfil(idPerfil: string): Promise<any> {

    // 1️⃣ Verificar si el perfil existe
    const perfil = await this.databaseService.executeQuery(
      `SELECT nombrePerfil FROM perfil WHERE idPerfil = ?`,
      [idPerfil]
    )

    if (perfil.length === 0) {
      return {
        ok: false,
        message: "El perfil no existe",
      }
    }

    // 2️⃣ No permitir eliminar Administrador
    if (perfil[0].idPerfil === "PF0001") {
      return {
        ok: false,
        message: "No se puede eliminar el Perfil Administrador",
      }
    }

    // 3️⃣ Verificar relación con permisos
    const hasRelation = await this.databaseService.executeQuery(
      `SELECT 1 FROM perfilmenu WHERE idPerfil = ? LIMIT 1`,
      [idPerfil]
    )

    if (hasRelation.length > 0) {
      return {
        ok: false,
        message: "No se puede eliminar el Perfil, tiene permisos asignados.",
      }
    }

    // 4️⃣ Eliminar
    const result = await this.databaseService.executeQuery(
      `DELETE FROM perfil WHERE idPerfil = ?`,
      [idPerfil]
    )

    return {
      ok: result.affectedRows > 0,
    }
  }

  async deleteUsuario(idUsuario: string): Promise<{ ok: boolean; message?: string }> {

    // 1️⃣ Verificar si el usuario existe
    const usuario = await this.databaseService.executeQuery(
      `SELECT nombre, idPerfil FROM users WHERE userId = ?`,
      [idUsuario]
    )

    if (usuario.length === 0) {
      return {
        ok: false,
        message: "El usuario no existe",
      }
    }

    // 2️⃣ No permitir eliminar Administrador
    if (usuario[0].idPerfil === "PF0001") {
      return {
        ok: false,
        message: "No se puede eliminar el usuario Administrador",
      }
    }

    // 3️⃣ Transacción
    const connection = await this.databaseService.getConnection()

    try {
      await connection.beginTransaction()

      await this.databaseService.executeQuery(
        `DELETE FROM preguntasfallidas WHERE idUsuario = ?`,
        [idUsuario]
      )

      await this.databaseService.executeQuery(
        `DELETE FROM progreso WHERE idUsuario = ?`,
        [idUsuario]
      )

      await this.databaseService.executeQuery(
        `DELETE FROM sessions WHERE userId = ?`,
        [idUsuario]
      )

      await this.databaseService.executeQuery(
        `DELETE FROM usuariotalleres WHERE idUsuario = ?`,
        [idUsuario]
      )

      // 4️⃣ Eliminar
      const result = await this.databaseService.executeQuery(
        `DELETE FROM users WHERE userId = ?`,
        [idUsuario]
      )

      await connection.commit()

      return {
        ok: result.affectedRows > 0,
      }
    } catch (error) {
      await connection.rollback()
      return {
        ok: false,
        message: error.message || 'Error al eliminar el usuario',
      }
    } finally {
      connection.release()
    }
  }

  async getTreeByPerfil(idPerfil: string) {

    const menuCompleto = await this.databaseService.executeQuery(
      `SELECT m.idMenu, m.nombre AS nombreMenu, m.icon, m.ruta, m.otrasRutas, sm.idSubMenu, 
       sm.nombre AS nombreSubMenu, sm.icon AS iconSubMenu, sm.ruta AS rutaSubmenu
       FROM menu m
       LEFT JOIN submenu sm ON sm.idMenu = m.idMenu
       ORDER BY m.orden, sm.orden;`
    );

    const permisosCompletos = await this.databaseService.executeQuery(
      `SELECT idPermiso, idMenu, idSubMenu, nombre, descripcion
       FROM permisos
       WHERE estado = 1;`
    )

    const perfilPermiso = await this.databaseService.executeQuery(
      `SELECT idPermiso, estado AS estadoPermiso
       FROM perfilpermiso
       WHERE idPerfil = ?;`,
      [idPerfil]
    );

    const perfilSubmenu = await this.databaseService.executeQuery(
      `SELECT idSubMenu, estado AS estadoSubMenu
       FROM perfilsubmenu
       WHERE idPerfil = ?;`,
      [idPerfil]
    );

    const perfilMenu = await this.databaseService.executeQuery(
      `SELECT idMenu, estado AS estadoMenu
       FROM perfilmenu
       WHERE idPerfil = ?;`,
      [idPerfil]
    );

    return this.util.buildTreeToAcces(menuCompleto, permisosCompletos, perfilMenu, perfilSubmenu, perfilPermiso)
  }

  // async updateAccesos(idPerfil: string, body: { accesos: Record<string, boolean> }): Promise<{ ok: boolean; message?: string }> {
  //   const { accesos } = body;

  //   for (const [id, checked] of Object.entries(accesos)) {
  //     const estado = checked ? 1 : 0;

  //     if (id.startsWith('MN')) {
  //       const register = await this.databaseService.executeQuery(
  //         `SELECT 1 FROM perfilmenu WHERE idPerfil = ? AND idMenu = ?`,
  //         [idPerfil, id]
  //       )

  //       if (register.length > 0) {
  //         await this.databaseService.executeQuery(
  //           `UPDATE perfilmenu SET estado = ? WHERE idPerfil = ? AND idMenu = ?`,
  //           [estado, idPerfil, id]
  //         );
  //       } else {
  //         await this.databaseService.executeQuery(
  //           `INSERT INTO perfilmenu (idPerfil, idMenu, estado)
  //            VALUES (?, ?, ?)`,
  //           [idPerfil, id, estado]
  //         );
  //       }

  //     } else if (id.startsWith('SM')) {
  //       const register = await this.databaseService.executeQuery(
  //         `SELECT 1 FROM perfilsubmenu WHERE idPerfil = ? AND idSubmenu = ?`,
  //         [idPerfil, id]
  //       )

  //       const idMenu = await this.databaseService.executeQuery(
  //         `SELECT idMenu FROM submenu WHERE idSubMenu = ?`,
  //         [id]
  //       )

  //       if (register.length > 0) {
  //         await this.databaseService.executeQuery(
  //           `UPDATE perfilsubmenu SET estado = ? WHERE idPerfil = ? AND idSubMenu = ?`,
  //           [estado, idPerfil, id]
  //         );
  //       } else {
  //         await this.databaseService.executeQuery(
  //           `INSERT INTO perfilsubmenu (idMenu, idSubmenu, idPerfil, estado)
  //            VALUES (?, ?, ?, ?)`,
  //           [idMenu, id, idPerfil, estado]
  //         );
  //       }
  //     } else if (id.startsWith('PM')) {
  //       const register = await this.databaseService.executeQuery(
  //         `SELECT 1 FROM perfilpermiso WHERE idPerfil = ? AND idPermiso = ?`,
  //         [idPerfil, id]
  //       )

  //       const ids = await this.databaseService.executeQuery(
  //         `SELECT idMenu, idSubMenu FROM permisos WHERE idPermiso = ?`,
  //         [id]
  //       )

  //       if (register.length > 0) {
  //         await this.databaseService.executeQuery(
  //           `UPDATE perfilpermiso SET estado = ? WHERE idPerfil = ? AND idPermiso = ?`,
  //           [estado, idPerfil, id]
  //         );
  //       } else {
  //         await this.databaseService.executeQuery(
  //           `INSERT INTO perfilpermiso (idPerfil, idMenu, idSubMenu, idPermiso, estado)
  //            VALUES (?, ?, ?, ?, ?)`,
  //           [idPerfil, ids.idMenu, ids.idSubMenu, id, estado]
  //         );
  //       }
  //     }
  //   }

  //   return { ok: true };
  // }

  async updateAccesos(
    idPerfil: string,
    body: { accesos: Record<string, boolean> }
  ): Promise<{ ok: boolean; message?: string }> {

    const { accesos } = body;

    const conn = await this.databaseService.getConnection();

    try {
      await conn.beginTransaction();

      /* ================= CARGAR DATA EXISTENTE ================= */

      const perfilMenu = await this.databaseService.executeQuery(
        `SELECT idMenu, estado FROM perfilmenu WHERE idPerfil = ?`,
        [idPerfil]
      );

      const perfilSubmenu = await this.databaseService.executeQuery(
        `SELECT idSubMenu, estado FROM perfilsubmenu WHERE idPerfil = ?`,
        [idPerfil]
      );

      const perfilPermiso = await this.databaseService.executeQuery(
        `SELECT idPermiso, estado FROM perfilpermiso WHERE idPerfil = ?`,
        [idPerfil]
      );

      const permisos = await this.databaseService.executeQuery(
        `SELECT idPermiso, idMenu, idSubMenu FROM permisos`
      ) as PermisoInfo[];

      /* ================= MAPAS EN MEMORIA ================= */

      const menuMap = new Map(perfilMenu.map(m => [m.idMenu, m.estado]));
      const subMenuMap = new Map(perfilSubmenu.map(s => [s.idSubMenu, s.estado]));
      const permisoMap = new Map(perfilPermiso.map(p => [p.idPermiso, p.estado]));

      const permisoInfoMap = new Map<string, PermisoInfo>(
        permisos.map(p => [p.idPermiso, p])
      );

      /* ================= PROCESAR ACCESOS ================= */

      for (const [id, checked] of Object.entries(accesos)) {
        const estado = checked ? 1 : 0;

        /* ---------- MENU ---------- */
        if (id.startsWith('MN')) {
          if (menuMap.has(id)) {
            if (menuMap.get(id) !== estado) {
              await conn.query(
                `UPDATE perfilmenu SET estado = ? WHERE idPerfil = ? AND idMenu = ?`,
                [estado, idPerfil, id]
              );
            }
          } else {
            await conn.query(
              `INSERT INTO perfilmenu (idPerfil, idMenu, estado)
             VALUES (?, ?, ?)`,
              [idPerfil, id, estado]
            );
          }
        }

        /* ---------- SUBMENU ---------- */
        else if (id.startsWith('SM')) {
          if (subMenuMap.has(id)) {
            if (subMenuMap.get(id) !== estado) {
              await conn.query(
                `UPDATE perfilsubmenu SET estado = ? WHERE idPerfil = ? AND idSubMenu = ?`,
                [estado, idPerfil, id]
              );
            }
          } else {
            const [row] = await conn.query(
              `SELECT idMenu FROM submenu WHERE idSubMenu = ?`,
              [id]
            );

            if (!row) continue;

            await conn.query(
              `INSERT INTO perfilsubmenu (idMenu, idSubMenu, idPerfil, estado)
             VALUES (?, ?, ?, ?)`,
              [row[0].idMenu, id, idPerfil, estado]
            );
          }
        }

        /* ---------- PERMISO ---------- */
        else if (id.startsWith('PM')) {
          const info = permisoInfoMap.get(id);
          if (!info) continue;

          if (permisoMap.has(id)) {
            if (permisoMap.get(id) !== estado) {
              await conn.query(
                `UPDATE perfilpermiso
               SET estado = ?
               WHERE idPerfil = ? AND idPermiso = ?`,
                [estado, idPerfil, id]
              );
            }
          } else {
            await conn.query(
              `INSERT INTO perfilpermiso
             (idPerfil, idMenu, idSubMenu, idPermiso, estado)
             VALUES (?, ?, ?, ?, ?)`,
              [idPerfil, info.idMenu, info.idSubMenu, id, estado]
            );
          }
        }
      }

      await conn.commit();
      return { ok: true };

    } catch (error) {
      await conn.rollback();
      console.error(error);
      return { ok: false, message: 'Error al guardar accesos' };
    } finally {
      conn.release();
    }
  }

}