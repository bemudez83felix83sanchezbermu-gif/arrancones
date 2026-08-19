/**
 * Crea (si no existe) el esquema de participantes en Neon.
 * Uso: npm run db:setup
 */
import { getSql } from '../shared/db.js';

const sql = getSql();

await sql`
  create table if not exists participants (
    id            bigint generated always as identity primary key,
    pilot_name    text not null,
    copilot_name  text,
    category      text not null check (category in ('drift','car_show','arrancones')),
    vehicle_name  text not null,
    phone         text not null,
    state         text,
    city          text not null,
    social        text,
    status        text not null default 'pendiente'
                  check (status in ('pendiente','confirmado','cancelado')),
    notes         text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    constraint arrancones_sin_copiloto
      check (category <> 'arrancones' or copilot_name is null)
  )
`;

// Para bases creadas antes de que existiera el selector de estado.
await sql`alter table participants add column if not exists state text`;

await sql`create index if not exists participants_category_idx on participants (category)`;
await sql`create index if not exists participants_status_idx   on participants (status)`;
await sql`create index if not exists participants_created_idx  on participants (created_at desc)`;
await sql`create index if not exists participants_city_idx     on participants (lower(city))`;
await sql`create index if not exists participants_state_idx     on participants (state)`;

const [{ count }] = await sql`select count(*)::int as count from participants`;
console.log(`OK · tabla participants lista · ${count} registros`);
