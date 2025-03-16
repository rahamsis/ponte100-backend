// src/database/database.service.ts
import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: Number(process.env.MYSQL_PORT),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const [results] = await this.pool.execute(query, params);
      return results;
    } catch (error) {
      throw new Error(`Error ejecutando la consulta: ${error.message}`);
    }
  }
}