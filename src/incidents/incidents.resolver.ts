import { Args, ID, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Incident } from './models/incident.model';
import { IncidentPage } from './models/incident-page.model';
import { Technician } from '../technicians/models/technician.model';
import { IncidentsService } from './incidents.service';
import { CreateIncidentInput } from './dto/create-incident.input';
import { UpdateIncidentInput } from './dto/update-incident.input';
import { IncidentFilterInput } from './dto/incident-filter.input';
import { PaginationInput } from './dto/pagination.input';
@Resolver(() => Incident)
export class IncidentsResolver {
  constructor(private readonly incidentsService: IncidentsService) {}
  @Query(() => Incident, { description: 'Obtiene una incidencia por su identificador.' })
  incident(@Args('id', { type: () => ID }) id: string): Incident {
    return this.incidentsService.findOne(id);
  }
  @Query(() => IncidentPage, { description: 'Lista incidencias aplicando filtros y paginación.' })
  incidents(
    @Args('filter', { type: () => IncidentFilterInput, nullable: true }) filter?: IncidentFilterInput,
    @Args('pagination', { type: () => PaginationInput, nullable: true }) pagination?: PaginationInput,
  ): IncidentPage { return this.incidentsService.findAll(filter, pagination); }
  @Mutation(() => Incident, { description: 'Crea una incidencia abierta y la asigna a un técnico existente.' })
  createIncident(@Args('input') input: CreateIncidentInput): Incident {
    return this.incidentsService.create(input);
  }
  @Mutation(() => Incident, { description: 'Actualiza los campos enviados de una incidencia existente.' })
  updateIncident(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdateIncidentInput): Incident {
    return this.incidentsService.update(id, input);
  }
  @ResolveField(() => Technician)
  assignee(@Parent() incident: Incident): Technician { return incident.assignee; }
}
