# Demostración rápida

Inicia el servicio siguiendo el [README](README.md) y abre http://localhost:3001/graphql. Copia `operations.graphql` al editor y selecciona la operación por nombre al ejecutarla (o copia una sola operación). Pega el JSON correspondiente en el panel de variables. En un cliente HTTP, envía también `operationName` si incluyes varias operaciones.

## ListIncidents

```json
{
  "filter": { "status": "OPEN" },
  "pagination": { "page": 1, "pageSize": 3 }
}
```

Devuelve hasta 3 incidencias abiertas y los metadatos de paginación. Copia un `items[].assignee.id` para crear una incidencia y un `items[].id` para consultarla. Los IDs cambian al reiniciar.

## GetIncident

```json
{ "id": "REEMPLAZAR_CON_ID_INCIDENCIA" }
```

Reemplaza el placeholder por un ID obtenido en la lista. Devuelve la incidencia con su técnico.

## CreateIncident

```json
{
  "input": {
    "title": "Servidor de pruebas sin conexión",
    "description": "Incidencia creada desde GraphQL",
    "priority": "HIGH",
    "assigneeId": "REEMPLAZAR_CON_ID_TECNICO"
  }
}
```

Reemplaza el placeholder por `assignee.id` de la lista. Resultado: nueva incidencia con `status: OPEN`. Guarda el `id` devuelto.

## UpdateIncident

```json
{
  "id": "REEMPLAZAR_CON_ID_INCIDENCIA_CREADA",
  "input": { "status": "IN_PROGRESS", "priority": "MEDIUM" }
}
```

Usa el ID de la creación. Resultado: estado y prioridad actualizados; el título se conserva.

## CreateInvalidIncident — entrada inválida

```json
{
  "input": {
    "title": "A",
    "description": "Prueba inválida",
    "priority": "HIGH",
    "assigneeId": "00000000-0000-0000-0000-000000000000"
  }
}
```

Resultado: `errors[].extensions.code: BAD_USER_INPUT` por el título demasiado corto. No se crea una incidencia.

## TestPageLimit — límite de página

```json
{ "pagination": { "page": 1, "pageSize": 21 } }
```

Resultado: `BAD_USER_INPUT`; no se devuelve una página mayor de 20 registros.

## GetIncident — recurso inexistente

```json
{ "id": "00000000-0000-0000-0000-000000000000" }
```

Resultado: `NOT_FOUND` y mensaje `Incident not found`.
