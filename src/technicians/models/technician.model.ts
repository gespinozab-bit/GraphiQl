import { Field, ID, ObjectType } from '@nestjs/graphql';
@ObjectType()
export class Technician {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field(() => String, { nullable: true }) specialty!: string | null;
  @Field() active!: boolean;
}
