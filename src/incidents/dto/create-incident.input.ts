import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { IncidentPriority } from '../models/incident-priority.enum';
@InputType()
export class CreateIncidentInput {
  @Field() @IsString() @Length(3, 100) title!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(500) description?: string | null;
  @Field(() => IncidentPriority) @IsEnum(IncidentPriority) priority!: IncidentPriority;
  @Field(() => ID) @IsUUID() assigneeId!: string;
}
