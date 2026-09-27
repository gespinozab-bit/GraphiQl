import { ValidationPipe } from '@nestjs/common';
import { GraphQLError } from 'graphql';
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
    exceptionFactory: errors => new GraphQLError(
      'Invalid input: ' + errors.flatMap(e => Object.values(e.constraints ?? {})).join('; '),
      { extensions: { code: 'BAD_USER_INPUT' } },
    ),
  });
}
