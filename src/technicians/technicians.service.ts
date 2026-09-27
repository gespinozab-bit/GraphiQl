import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Technician } from './models/technician.model';
import { notFound } from '../common/errors';
@Injectable()
export class TechniciansService {
  private readonly technicians = new Map<string, Technician>(
    [
      { name: 'Ana López', specialty: 'Redes', active: true },
      { name: 'Luis Pérez', specialty: 'Software', active: true },
      { name: 'Marta Ruiz', specialty: null, active: false },
    ].map(data => { const id = randomUUID(); return [id, { id, ...data }]; }),
  );
  seedIds(): string[] { return [...this.technicians.keys()]; }
  assertExists(id: string): void { if (!this.technicians.has(id)) notFound('Technician'); }
  findByIds(ids: readonly string[]): Map<string, Technician> {
    const result = new Map<string, Technician>();
    for (const id of new Set(ids)) {
      const technician = this.technicians.get(id);
      if (!technician) notFound('Technician');
      result.set(id, { ...technician });
    }
    return result;
  }
}
