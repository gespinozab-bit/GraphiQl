import { Field, Int, ObjectType } from '@nestjs/graphql';
@ObjectType()
export class PageInfo {
  @Field(() => Int) page!: number;
  @Field(() => Int) pageSize!: number;
  @Field(() => Int) totalItems!: number;
  @Field(() => Int) totalPages!: number;
  @Field() hasNextPage!: boolean;
}
