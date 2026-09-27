import { registerEnumType } from '@nestjs/graphql';
export enum IncidentStatus { OPEN = 'OPEN', IN_PROGRESS = 'IN_PROGRESS', RESOLVED = 'RESOLVED' }
registerEnumType(IncidentStatus, { name: 'IncidentStatus' });
