import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TechniciansService } from '../technicians/technicians.service';
import { badInput, notFound } from '../common/errors';
import { Incident } from './models/incident.model';
import { IncidentPage } from './models/incident-page.model';
import { IncidentStatus } from './models/incident-status.enum';
import { IncidentPriority } from './models/incident-priority.enum';
import { CreateIncidentInput } from './dto/create-incident.input';
import { UpdateIncidentInput } from './dto/update-incident.input';
import { IncidentFilterInput } from './dto/incident-filter.input';
import { PaginationInput } from './dto/pagination.input';

// Storage records are private and never used as GraphQL object types.
type IncidentRecord = Omit<Incident, 'assignee'> & { assigneeId: string };
@Injectable()
export class IncidentsService {
  private readonly records = new Map<string, IncidentRecord>();
  constructor(private readonly technicians: TechniciansService) {
    const ids = technicians.seedIds();
    const titles = [
      'Falla de red en oficina', 'Error de acceso al correo', 'Impresora sin conexión',
      'Red inalámbrica intermitente', 'Actualización de aplicación', 'Pantalla dañada',
      'Red lenta en recepción', 'Error al exportar informe', 'Teclado sin respuesta',
      'Configuración de red', 'Error en portal interno', 'Equipo no enciende',
      'Red sin acceso a internet', 'Instalación de software', 'Revisión de servidor',
    ];
    titles.forEach((title, i) => {
      const id = randomUUID();
      this.records.set(id, {
        id, title, description: i % 4 === 0 ? null : 'Incidencia de demostración ' + (i + 1),
        status: Object.values(IncidentStatus)[i % 3],
        priority: Object.values(IncidentPriority)[Math.floor(i / 3) % 3],
        assigneeId: ids[Math.floor(i / 5)],
        createdAt: new Date(Date.UTC(2026, 0, 1, 8, i)),
      });
    });
  }
  private getRecord(id: string): IncidentRecord {
    const record = this.records.get(id);
    if (!record) notFound('Incident');
    return record;
  }
  private toPublic(records: IncidentRecord[]): Incident[] {
    // One batch service call after pagination, with unique IDs. The resolver
    // reads the attached technician; no individual lookup occurs per Incident.
    const technicians = this.technicians.findByIds([...new Set(records.map(r => r.assigneeId))]);
    return records.map(({ assigneeId, ...record }) => ({
      ...record, createdAt: new Date(record.createdAt), assignee: technicians.get(assigneeId)!,
    }));
  }
  findOne(id: string): Incident { return this.toPublic([this.getRecord(id)])[0]; }
  findAll(filter?: IncidentFilterInput | null, pagination?: PaginationInput | null): IncidentPage {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 10;
    // Enforce the operational limit even when called outside GraphQL.
    if (!Number.isInteger(page) || page < 1) badInput('page must be an integer greater than or equal to 1');
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 20) badInput('pageSize must be an integer between 1 and 20');
    const search = filter?.search?.toLowerCase();
    const filtered = [...this.records.values()].filter(r =>
      (filter?.status == null || r.status === filter.status) &&
      (filter?.priority == null || r.priority === filter.priority) &&
      (filter?.assigneeId == null || r.assigneeId === filter.assigneeId) &&
      (search == null || r.title.toLowerCase().includes(search)),
    );
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      items: this.toPublic(filtered.slice((page - 1) * pageSize, page * pageSize)),
      pageInfo: { page, pageSize, totalItems, totalPages, hasNextPage: page < totalPages },
    };
  }
  create(input: CreateIncidentInput): Incident {
    this.technicians.assertExists(input.assigneeId);
    const record: IncidentRecord = {
      id: randomUUID(), title: input.title, description: input.description ?? null,
      priority: input.priority, assigneeId: input.assigneeId,
      status: IncidentStatus.OPEN, createdAt: new Date(),
    };
    this.records.set(record.id, record);
    return this.toPublic([record])[0];
  }
  update(id: string, input: UpdateIncidentInput): Incident {
    const current = this.getRecord(id);
    if (input.assigneeId !== undefined) this.technicians.assertExists(input.assigneeId);
    const updated = { ...current };
    if (input.title !== undefined) updated.title = input.title;
    if (input.description !== undefined) updated.description = input.description;
    if (input.status !== undefined) updated.status = input.status;
    if (input.priority !== undefined) updated.priority = input.priority;
    if (input.assigneeId !== undefined) updated.assigneeId = input.assigneeId;
    this.records.set(id, updated);
    return this.toPublic([updated])[0];
  }
}
