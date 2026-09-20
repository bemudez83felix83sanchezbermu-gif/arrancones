/**
 * Crea (si no existe) el esquema de participantes en Neon.
 * Uso: npm run db:setup
 */
import { getSql } from '../shared/db.js';
import { ARRANCONES_CLASS_IDS } from '../shared/participants.js';

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

// Subcategoría de arrancones. Se agrega en caliente para bases anteriores.
// El CHECK se tira y se vuelve a crear en cada corrida a partir de
// ARRANCONES_CLASS_IDS: así agregar una clase en shared/participants.js es el
// único paso y la BD nunca se queda con la lista vieja.
await sql`alter table participants add column if not exists race_class text`;

// Un CHECK es DDL: no admite parámetros, así que la lista va como literal.
// Los ids son constantes nuestras, pero se validan para que nadie meta comillas.
const claseInvalida = ARRANCONES_CLASS_IDS.find((id) => !/^[a-z0-9_]+$/.test(id));
if (claseInvalida) {
  throw new Error(`Id de clase inválido en ARRANCONES_CLASSES: "${claseInvalida}"`);
}
const listaClases = ARRANCONES_CLASS_IDS.map((id) => `'${id}'`).join(',');

await sql.query('alter table participants drop constraint if exists participants_race_class_valida');
await sql.query(`
  alter table participants add constraint participants_race_class_valida
    check (
      (category = 'arrancones' and race_class in (${listaClases}))
      or (category <> 'arrancones' and race_class is null)
    )
`);

await sql`create index if not exists participants_category_idx on participants (category)`;
await sql`create index if not exists participants_status_idx   on participants (status)`;
await sql`create index if not exists participants_created_idx  on participants (created_at desc)`;
await sql`create index if not exists participants_city_idx     on participants (lower(city))`;
await sql`create index if not exists participants_state_idx     on participants (state)`;
await sql`create index if not exists participants_race_class_idx on participants (race_class)`;

await sql`
  create table if not exists admins (
    id            bigint generated always as identity primary key,
    username      text not null unique,
    password_hash text not null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    last_login_at timestamptz
  )
`;
await sql`create index if not exists admins_username_lower_idx on admins (lower(username))`;

// ---------- Taquilla: tipos de entrada, ventas y renglones de cada venta ----------

await sql`
  create table if not exists ticket_types (
    id          bigint generated always as identity primary key,
    name        text not null,
    price       numeric(10,2) not null check (price >= 0),
    active      boolean not null default true,
    sort_order  integer not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
  )
`;
await sql`create unique index if not exists ticket_types_name_lower_idx on ticket_types (lower(name))`;

// client_id lo genera el dispositivo: si una venta guardada sin señal se reintenta,
// el unique evita que se cuente dos veces.
await sql`
  create table if not exists ticket_sales (
    id              bigint generated always as identity primary key,
    client_id       uuid not null unique,
    payment_method  text not null
                    check (payment_method in ('efectivo','tarjeta','transferencia','cortesia')),
    people          integer not null check (people > 0),
    total           numeric(10,2) not null check (total >= 0),
    cashier         text,
    notes           text,
    sold_at         timestamptz not null default now(),
    created_by      bigint references admins(id) on delete set null,
    created_at      timestamptz not null default now(),
    voided_at       timestamptz,
    voided_by       bigint references admins(id) on delete set null,
    void_reason     text,
    constraint ticket_sales_cortesia_sin_cobro
      check ((payment_method = 'cortesia') = (total = 0))
  )
`;
await sql`create index if not exists ticket_sales_sold_idx on ticket_sales (sold_at desc)`;

// Nombre y precio se copian al vender: cambiar un precio no altera ventas pasadas.
await sql`
  create table if not exists ticket_sale_items (
    id              bigint generated always as identity primary key,
    sale_id         bigint not null references ticket_sales(id) on delete cascade,
    ticket_type_id  bigint references ticket_types(id) on delete set null,
    name            text not null,
    unit_price      numeric(10,2) not null check (unit_price >= 0),
    quantity        integer not null check (quantity > 0)
  )
`;
await sql`create index if not exists ticket_sale_items_sale_idx on ticket_sale_items (sale_id)`;
await sql`create index if not exists ticket_sale_items_type_idx on ticket_sale_items (ticket_type_id)`;

// Venta con sus renglones en una sola fila. Se recrea para tomar columnas nuevas.
await sql`drop view if exists ticket_sales_full`;
await sql`
  create view ticket_sales_full as
  select
    s.*,
    coalesce(
      json_agg(
        json_build_object(
          'ticket_type_id', i.ticket_type_id,
          'name', i.name,
          'unit_price', i.unit_price,
          'quantity', i.quantity
        ) order by i.id
      ) filter (where i.id is not null),
      '[]'::json
    ) as items
  from ticket_sales s
  left join ticket_sale_items i on i.sale_id = s.id
  group by s.id
`;

const [{ count }] = await sql`select count(*)::int as count from participants`;
const [{ admins }] = await sql`select count(*)::int as admins from admins`;
const [{ tipos }] = await sql`select count(*)::int as tipos from ticket_types`;
const [{ ventas }] = await sql`select count(*)::int as ventas from ticket_sales`;
console.log(`OK · tabla participants lista · ${count} registros · ${admins} admin(s)`);
console.log(`OK · taquilla lista · ${tipos} tipo(s) de entrada · ${ventas} venta(s)`);
