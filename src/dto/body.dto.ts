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

export class ProgressResultDto {
  userId: string;
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
  idGrado: string;
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

export class ClienteDto {
  nombre: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  departamento: string;
  provincia: string;
  codigoPostal: string;
  identityType: string;
  identityCode: string;
}

export class ChargeDto {
  token: string;
  email: string;
  amount: number;
  nombreProducto: string;
  cliente: ClienteDto;
}

export class CrudProgress {
  idUsuario: string;
  tipoExamen: string;
  timer: string;
  intentos: string;
  totalPreguntas: string;
  correctas: string;
  incorrectas: string;
  nulas: string;
}

export class CrudUsuarioTalleres {
  idUsuario: string;
  idTaller: string;
  activo: boolean;
  idUsuarioregistro: string;
}

export class CrudUsuario {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  cip: string;
  dni: string;
  idGrado: string;
  genero: string;
  username: string;
  password: string;
}