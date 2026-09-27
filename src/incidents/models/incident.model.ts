import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Technician } from '../../technicians/models/technician.model';
import { IncidentStatus } from './incident-status.enum';
import { IncidentPriority } from './incident-priority.enum';
@ObjectType()
export class Incident {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field(() => String, { nullable: true }) description!: string | null;
  @Field(() => IncidentStatus) status!: IncidentStatus;
  @Field(() => IncidentPriority) priority!: IncidentPriority;
  @Field(() => Technician) assignee!: Technician;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
}
