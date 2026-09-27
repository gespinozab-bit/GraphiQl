import { Module } from '@nestjs/common';
import { TechniciansModule } from '../technicians/technicians.module';
import { IncidentsResolver } from './incidents.resolver';
import { IncidentsService } from './incidents.service';
@Module({ imports: [TechniciansModule], providers: [IncidentsResolver, IncidentsService] })
export class IncidentsModule {}
