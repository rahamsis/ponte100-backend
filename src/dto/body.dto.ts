export class BodyDto {
  email: string;
  password: string;
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