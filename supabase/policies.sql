-- Supabase RLS policies for StadiumMind AI

alter table public.profiles enable row level security;
alter table public.stadiums enable row level security;
alter table public.matches enable row level security;
alter table public.stadium_zones enable row level security;
alter table public.tickets enable row level security;
alter table public.volunteers enable row level security;
alter table public.incidents enable row level security;
alter table public.recommendations enable row level security;
alter table public.action_history enable row level security;
alter table public.simulation_events enable row level security;
alter table public.ai_logs enable row level security;
alter table public.transport_metrics enable row level security;
alter table public.sustainability_metrics enable row level security;

create or replace function public.current_app_role()
returns app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "public read stadiums" on public.stadiums for select using (true);
create policy "public read matches" on public.matches for select using (true);
create policy "public read zones" on public.stadium_zones for select using (true);

create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "admins read all profiles" on public.profiles
  for select using (public.current_app_role() = 'admin');

create policy "admins manage operational tables" on public.incidents
  for all using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "volunteers read incidents" on public.incidents
  for select using (public.current_app_role() in ('admin', 'volunteer'));

create policy "volunteers create incidents" on public.incidents
  for insert with check (public.current_app_role() in ('admin', 'volunteer'));

create policy "admins manage recommendations" on public.recommendations
  for all using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "volunteers read recommendations" on public.recommendations
  for select using (public.current_app_role() in ('admin', 'volunteer'));

create policy "admins manage action history" on public.action_history
  for all using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "operational read simulation" on public.simulation_events
  for select using (public.current_app_role() in ('admin', 'volunteer'));

create policy "admins manage simulation" on public.simulation_events
  for all using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "operational read ai logs" on public.ai_logs
  for select using (public.current_app_role() = 'admin');

create policy "operational metrics read" on public.transport_metrics
  for select using (public.current_app_role() in ('admin', 'volunteer'));

create policy "sustainability metrics read" on public.sustainability_metrics
  for select using (public.current_app_role() in ('admin', 'volunteer'));

-- Ticket validation should be performed through a backend service role endpoint.
-- Do not expose broad public ticket reads in the frontend.
