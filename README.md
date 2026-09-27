# Servicio GraphQL de Gestión de Incidencias

Servicio GraphQL desarrollado con NestJS y TypeScript para administrar incidencias y sus técnicos responsables. Demuestra un esquema tipado, selección de campos, relaciones entre tipos, queries y mutations, filtros, paginación, validación, errores seguros y prevención de N+1.

Utiliza almacenamiento en memoria con 3 técnicos y 15 incidencias iniciales. Los datos y sus UUID se regeneran al reiniciar la aplicación.

## Tecnologías

- TypeScript y NestJS.
- `@nestjs/graphql` y Apollo Server.
- GraphQL code-first mediante decoradores.
- `class-validator` y `class-transformer`, con `ValidationPipe` global.

No utiliza base de datos, Docker, autenticación, credenciales ni secretos.

## Instalación y ejecución

Requisitos: Node.js >= 22.14.0 y pnpm 11.1.0, según `package.json`. Desde la raíz del proyecto:

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run start
```

Abre la interfaz GraphiQL en **http://localhost:3001/graphql**. El puerto predeterminado es 3001; puede cambiarse con la variable de entorno `PORT`.

En Windows, si PowerShell bloquea `pnpm.ps1`, usa `pnpm.cmd` en lugar de `pnpm` en estos comandos. No es necesario cambiar la política de ejecución.

Opcionalmente, `pnpm run start:dev` recompila al editar archivos y `pnpm test` ejecuta el build y las pruebas existentes.

## Dominio

### Incident

Representa una incidencia. Campos públicos: `id`, `title`, `description`, `status`, `priority`, `createdAt` y `assignee`.

### Technician

Representa al técnico responsable. Campos públicos: `id`, `name`, `specialty` y `active`.

```text
Technician 1 --- N Incident
```

Cada incidencia tiene un técnico asignado, accesible mediante el campo GraphQL `assignee`.

## Diseño del esquema

`id`, `title`, `status`, `priority`, `createdAt` y `assignee` son no nullable: toda incidencia debe tener identidad, título, estado, prioridad, fecha y responsable. `description` es nullable porque puede omitirse. En `Technician`, `id`, `name` y `active` son obligatorios; `specialty` admite `null` si no está registrada.

Los enums públicos son `IncidentStatus` (`OPEN`, `IN_PROGRESS`, `RESOLVED`) e `IncidentPriority` (`LOW`, `MEDIUM`, `HIGH`).

El esquema público no copia automáticamente el almacenamiento: los registros internos guardan `assigneeId`, mientras `Incident` expone la relación `assignee`. `CreateIncidentInput` acepta `title`, `description`, `priority` y `assigneeId`; no permite establecer `id`, `createdAt` ni `status`. El servidor genera el UUID y la fecha, y asigna `OPEN`.

`UpdateIncidentInput` permite omitir campos para conservar su valor. `description: null` borra la descripción; enviar `null` en los demás campos de actualización produce un error de validación.

[`schema.gql`](schema.gql) se genera automáticamente al iniciar NestJS desde los decoradores code-first. Está incluido como entregable; no debe editarse manualmente. El build compila TypeScript y el arranque genera el esquema.

## Operaciones disponibles

### Queries

```graphql
incident(id: ID!): Incident!
incidents(filter: IncidentFilterInput, pagination: PaginationInput): IncidentPage!
```

`incident` obtiene una incidencia por identificador. `incidents` lista incidencias aplicando filtros y paginación.

### Mutations

```graphql
createIncident(input: CreateIncidentInput!): Incident!
updateIncident(id: ID!, input: UpdateIncidentInput!): Incident!
```

`createIncident` crea una incidencia abierta con un técnico existente. `updateIncident` modifica únicamente el contenido, estado, prioridad o técnico enviados.

Las firmas anteriores describen el esquema. Las operaciones ejecutables, con nombres explícitos y variables tipadas, están en [`operations.graphql`](operations.graphql); sus variables JSON y resultados esperados están en [`DEMO.md`](DEMO.md).

## Filtros y paginación

`IncidentFilterInput` permite combinar filtros opcionales por `status`, `priority`, `assigneeId` y `search`. La búsqueda `search` se aplica sobre el título sin distinguir mayúsculas y minúsculas.

`PaginationInput` usa `page` (predeterminado: 1) y `pageSize` (predeterminado: 10). Ambos son enteros y su mínimo es 1. El máximo de `pageSize` es **20**: solicitar más produce `BAD_USER_INPUT`, en lugar de devolver una colección mayor. Es un control operativo del tamaño de cada página, aplicado tanto en la validación como en el servicio.

Primero se filtra, después se cuenta el total y se selecciona la página. `IncidentPage` contiene `items: [Incident!]!` y `pageInfo`, cuyos campos son todos no nullable: `page`, `pageSize`, `totalItems`, `totalPages` y `hasNextPage`. `totalPages` redondea hacia arriba y `hasNextPage` indica si queda otra página. Sin coincidencias hay cero páginas; una página fuera del rango devuelve `items: []`.

## Estrategia para evitar N+1

Una selección como esta puede requerir el técnico de cada incidencia:

```graphql
# Fragmento de selección dentro de incidents
items {
  title
  assignee {
    name
  }
}
```

Buscar cada técnico por separado al resolver `assignee` produciría una búsqueda adicional por incidencia. Aquí se utiliza precarga por lote:

1. `IncidentsService.findAll` obtiene las incidencias filtradas y paginadas.
2. `toPublic` recopila los `assigneeId` únicos de esa página con un `Set`.
3. Una sola llamada a `TechniciansService.findByIds` recupera los técnicos en un `Map`.
4. `toPublic` asocia los técnicos precargados a los objetos públicos. El `ResolveField` de `assignee` retorna el objeto ya asociado.

No se realiza una búsqueda independiente en el servicio de técnicos por cada incidencia. La asociación usa el mapa precargado; no se utiliza DataLoader. Las pruebas existentes comprueban una sola llamada por lote con IDs únicos.

## Validación y errores

- `title`: entre 3 y 100 caracteres.
- `description`: máximo 500 caracteres.
- `assigneeId`: UUID de un técnico existente al crear o reasignar.
- `status` y `priority`: valores de sus enums.
- `page`: entero mínimo 1; `pageSize`: entero entre 1 y 20.

`BAD_USER_INPUT` identifica entradas inválidas, con mensajes de validación comprensibles. `NOT_FOUND` indica una incidencia o un técnico inexistente al consultar por ID o asignar responsable, con mensajes como `Incident not found` y `Technician not found`. Un filtro sin coincidencias devuelve una colección vacía.

Las respuestas no exponen stack traces, rutas internas ni detalles innecesarios del servidor. Los errores internos inesperados se presentan como `Internal server error` con código `INTERNAL_SERVER_ERROR`.

## Comparación con REST

| Caso | GraphQL | REST equivalente |
| --- | --- | --- |
| Obtener incidencia | `incident(id)` | `GET /incidents/:id` |
| Listar incidencias | `incidents(filter, pagination)` | `GET /incidents?...` |
| Crear incidencia | `createIncident` | `POST /incidents` |
| Actualizar incidencia | `updateIncident` | `PATCH /incidents/:id` |
| Obtener técnico relacionado | `incident.assignee` | Recurso embebido o petición adicional |

Los endpoints REST son equivalencias ilustrativas; este proyecto implementa GraphQL. En este caso, GraphQL permite seleccionar solamente los campos necesarios y recorrer `Incident -> Technician` en una misma operación, evitando respuestas con campos innecesarios.

Como costo, añade complejidad al servidor y requiere vigilar N+1 y controlar tamaño, profundidad o complejidad de las consultas. Este proyecto controla el tamaño por página y precarga relaciones; no implementa un límite general de profundidad o complejidad.

REST podría ser más simple para recursos y operaciones predecibles y permite aprovechar directamente mecanismos HTTP como caching por URL. La elección depende del caso; GraphQL no es universalmente mejor que REST.
