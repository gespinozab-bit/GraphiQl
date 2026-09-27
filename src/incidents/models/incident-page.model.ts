import { Field, ObjectType } from '@nestjs/graphql';
import { Incident } from './incident.model';
import { PageInfo } from './page-info.model';
@ObjectType()
export class IncidentPage {
  @Field(() => [Incident]) items!: Incident[];
  @Field(() => PageInfo) pageInfo!: PageInfo;
}
