import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IncidentPriority } from '../models/incident-priority.enum';
import { IncidentStatus } from '../models/incident-status.enum';
@InputType()
export class IncidentFilterInput {
  @Field(() => IncidentStatus, { nullable: true }) @IsOptional() @IsEnum(IncidentStatus) status?: IncidentStatus | null;
  @Field(() => IncidentPriority, { nullable: true }) @IsOptional() @IsEnum(IncidentPriority) priority?: IncidentPriority | null;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() assigneeId?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() search?: string | null;
}
