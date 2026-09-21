import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const transport =
  !isProduction && !isTest
    ? {
        target: require.resolve('pino-pretty'),
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,service,env',
          singleLine: false,
        },
      }
    : undefined;

export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  transport,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'refreshToken',
      'refreshTokenHash',
      'accessToken',
      'token',
      'apiKey',
      'secret',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.secret',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: isProduction
    ? {
        service: 'iris-backend',
        env: process.env.NODE_ENV || 'development',
      }
    : undefined,
});
