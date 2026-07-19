-- StadiumMind AI Supabase schema
-- This schema is designed for a hackathon prototype with realistic relational boundaries.

create extension if not exists "uuid-ossp";

create type app_role as enum ('admin', 'volunteer');
create type incident_type as enum ('medical', 'security', 'maintenance', 'lost_child', 'lost_item', 'crowd', 'accessibility', 'transport');
create type incident_status as enum ('open', 'assigned', 'resolved', 'dismissed');
create type action_status as enum ('pending', 'applied', 'dismissed', 'expired');
create type zone_type as enum ('gate', 'section', 'food_court', 'washroom', 'medical', 'parking', 'transport', 'merchandise', 'accessibility');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role app_role not null,
  created_at timestamptz not null default now()
);

create table public.stadiums (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  host_city text not null,
  country text not null default 'United States',
  timezone text not null,
  capacity integer not null,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  home_team text not null,
  away_team text not null,
  stage text not null,
  kickoff_at timestamptz not null,
  stadium_id uuid not null references public.stadiums(id),
  status text not null default 'scheduled'
);

create table public.stadium_zones (
  id uuid primary key default uuid_generate_v4(),
  stadium_id uuid not null references public.stadiums(id) on delete cascade,
  code text not null,
  name text not null,
  zone_type zone_type not null,
  floor integer not null default 1,
  x numeric not null,
  y numeric not null,
  capacity integer,
  accessibility_score integer not null default 80,
  unique(stadium_id, code)
);

create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_id text unique not null,
  match_id uuid not null references public.matches(id) on delete cascade,
  seat_label text not null,
  section_code text not null,
  recommended_gate_code text not null,
  ticket_holder_label text,
  qr_payload jsonb not null,
  is_demo_valid boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.volunteers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete set null,
  match_id uuid references public.matches(id) on delete cascade,
  display_name text not null,
  assigned_zone_code text not null,
  status text not null default 'available',
  skills text[] not null default '{}'
);

create table public.incidents (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  type incident_type not null,
  status incident_status not null default 'open',
  priority integer not null check (priority between 1 and 5),
  location_code text not null,
  description text not null,
  created_by uuid references public.profiles(id),
  assigned_volunteer_id uuid references public.volunteers(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  title text not null,
  recommendation_type text not null,
  status action_status not null default 'pending',
  confidence integer not null check (confidence between 0 and 100),
  reason text not null,
  expected_outcome text not null,
  impacted_zones text[] not null default '{}',
  source_signals jsonb not null default '{}',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id)
);

create table public.action_history (
  id uuid primary key default uuid_generate_v4(),
  recommendation_id uuid references public.recommendations(id) on delete set null,
  match_id uuid not null references public.matches(id) on delete cascade,
  action_label text not null,
  status action_status not null,
  outcome_summary text,
  created_at timestamptz not null default now()
);

create table public.simulation_events (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  event_type text not null,
  severity integer not null check (severity between 1 and 5),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table public.ai_logs (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id) on delete cascade,
  agent_name text not null,
  request_summary text not null,
  response_summary text not null,
  response_json jsonb,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.transport_metrics (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  parking_utilization integer not null,
  metro_status text not null,
  bus_delay_minutes integer not null default 0,
  taxi_demand text not null,
  recorded_at timestamptz not null default now()
);

create table public.sustainability_metrics (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  electricity_kwh numeric not null,
  water_liters numeric not null,
  food_waste_kg numeric not null,
  plastic_waste_kg numeric not null,
  recorded_at timestamptz not null default now()
);

create index idx_matches_stadium on public.matches(stadium_id);
create index idx_tickets_ticket_id on public.tickets(ticket_id);
create index idx_incidents_match_status on public.incidents(match_id, status);
create index idx_recommendations_match_status on public.recommendations(match_id, status);
create index idx_simulation_events_match_created on public.simulation_events(match_id, created_at desc);
