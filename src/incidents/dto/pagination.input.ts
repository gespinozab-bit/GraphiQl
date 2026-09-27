import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';
@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 }) @IsInt() @Min(1) page: number = 1;
  @Field(() => Int, { defaultValue: 10 }) @IsInt() @Min(1) @Max(20, { message: 'pageSize must not exceed 20' }) pageSize: number = 10;
}
