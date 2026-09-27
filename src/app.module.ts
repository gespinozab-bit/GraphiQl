import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'node:path';
import { IncidentsModule } from './incidents/incidents.module';
import { createValidationPipe } from './common/validation';
import { formatError } from './common/errors';
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      graphiql: true,
      includeStacktraceInErrorResponses: false,
      formatError,
    }),
    IncidentsModule,
  ],
  providers: [{ provide: APP_PIPE, useFactory: createValidationPipe }],
})
export class AppModule {}
