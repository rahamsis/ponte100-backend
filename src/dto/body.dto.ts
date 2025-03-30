export class BodyDto {
  email: string;
  password: string;
  username: string;
}

export class SessionDto {
  userId: string;
  userDevice: string;
  userIp: string;
  sessionToken: string;
  sessionExpires: Date;
}

export class SessionTokenDto {
  sessionToken: string;
}

export class ValidatePersonDto {
  email: string;
  cip: string;
  dni: string;
}

export class QuantityQuestionsDto {
  userId: string;
  tableName: string;
}

export class IncorrectQuestionsDto {
  userId: string
  quantity: number
}

export class CrudQuestionsDto {
  userId: string;
  correctQuestionsIds: string[];
  incorrectQuestionIds: string[];
}

export class VerificationTokenDto {
  userId: string;
  token: string;
  expires: Date;
}

export class UpdateUserDeleteVerification {
  userId: string;
  token: string;
}

export class UpdateProfileUserDto {
  userId: string;
  nombre: string;
  apellidos: string;
  email: string;
  grupo: string;
  grado: string;
  dni: string;
  cip: string;
  fechaNacimiento: string;
  genero: string;
  username: string;
  password: string;
  telefono: number;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
}