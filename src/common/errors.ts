import { GraphQLError, GraphQLFormattedError } from 'graphql';
export function notFound(resource: 'Incident' | 'Technician'): never {
  throw new GraphQLError(resource + ' not found', { extensions: { code: 'NOT_FOUND' } });
}
export function badInput(message: string): never {
  throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}
export function formatError(error: GraphQLFormattedError): GraphQLFormattedError {
  const originalCode = String(error.extensions?.code ?? 'INTERNAL_SERVER_ERROR');
  const code = ['GRAPHQL_VALIDATION_FAILED', 'GRAPHQL_PARSE_FAILED'].includes(originalCode)
    ? 'BAD_USER_INPUT' : originalCode;
  const safe = code === 'BAD_USER_INPUT' || code === 'NOT_FOUND';
  return {
    message: safe ? error.message : 'Internal server error',
    ...(error.locations ? { locations: error.locations } : {}),
    ...(error.path ? { path: error.path } : {}),
    extensions: { code: safe ? code : 'INTERNAL_SERVER_ERROR' },
  };
}
