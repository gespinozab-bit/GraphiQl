import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength, ValidateIf } from 'class-validator';
import { IncidentPriority } from '../models/incident-priority.enum';
import { IncidentStatus } from '../models/incident-status.enum';
@InputType()
export class UpdateIncidentInput {
  // Omitted fields are untouched. Null is allowed only for description.
  @Field(() => String, { nullable: true }) @ValidateIf((_, v) => v !== undefined) @IsString() @Length(3, 100) title?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(500) description?: string | null;
  @Field(() => IncidentStatus, { nullable: true }) @ValidateIf((_, v) => v !== undefined) @IsEnum(IncidentStatus) status?: IncidentStatus;
  @Field(() => IncidentPriority, { nullable: true }) @ValidateIf((_, v) => v !== undefined) @IsEnum(IncidentPriority) priority?: IncidentPriority;
  @Field(() => ID, { nullable: true }) @ValidateIf((_, v) => v !== undefined) @IsUUID() assigneeId?: string;
}
