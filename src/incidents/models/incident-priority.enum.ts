import { registerEnumType } from '@nestjs/graphql';
export enum IncidentPriority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH' }
registerEnumType(IncidentPriority, { name: 'IncidentPriority' });
