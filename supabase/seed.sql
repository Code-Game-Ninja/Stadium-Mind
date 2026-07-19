-- Demo seed data for StadiumMind AI

insert into public.stadiums (id, name, host_city, country, timezone, capacity) values
  ('11111111-1111-1111-1111-111111111111', 'MetLife Stadium', 'New York/New Jersey', 'United States', 'America/New_York', 82500),
  ('22222222-2222-2222-2222-222222222222', 'AT&T Stadium', 'Dallas', 'United States', 'America/Chicago', 80000),
  ('33333333-3333-3333-3333-333333333333', 'SoFi Stadium', 'Los Angeles', 'United States', 'America/Los_Angeles', 70240);

insert into public.matches (id, code, home_team, away_team, stage, kickoff_at, stadium_id, status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NYJ-FRA-ESP-2026', 'France', 'Spain', 'Group Stage', '2026-06-14 19:00:00-04', '11111111-1111-1111-1111-111111111111', 'scheduled'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DAL-ENG-ARG-2026', 'England', 'Argentina', 'Group Stage', '2026-06-15 18:00:00-05', '22222222-2222-2222-2222-222222222222', 'scheduled'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'LA-BRA-JPN-2026', 'Brazil', 'Japan', 'Group Stage', '2026-06-16 20:00:00-07', '33333333-3333-3333-3333-333333333333', 'scheduled');

insert into public.stadium_zones (stadium_id, code, name, zone_type, floor, x, y, capacity, accessibility_score) values
  ('11111111-1111-1111-1111-111111111111', 'GATE-4', 'Gate 4', 'gate', 1, 15, 45, 9000, 85),
  ('11111111-1111-1111-1111-111111111111', 'GATE-5', 'Gate 5', 'gate', 1, 25, 52, 8500, 92),
  ('11111111-1111-1111-1111-111111111111', 'FOOD-C', 'Food Court C', 'food_court', 1, 42, 60, 1800, 80),
  ('11111111-1111-1111-1111-111111111111', 'WASH-E', 'East Washrooms', 'washroom', 1, 55, 62, 1000, 88),
  ('11111111-1111-1111-1111-111111111111', 'SEC-B', 'Section B', 'section', 2, 70, 48, 12000, 78),
  ('11111111-1111-1111-1111-111111111111', 'MED-1', 'Medical Point 1', 'medical', 1, 50, 50, 50, 95),
  ('11111111-1111-1111-1111-111111111111', 'METRO-2', 'Metro Exit 2', 'transport', 1, 5, 50, 12000, 90);

insert into public.tickets (ticket_id, match_id, seat_label, section_code, recommended_gate_code, ticket_holder_label, qr_payload) values
  ('WC2026-453621', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B-203', 'SEC-B', 'GATE-4', 'Demo Fan A', '{"ticket_id":"WC2026-453621","match_code":"NYJ-FRA-ESP-2026"}'),
  ('WC2026-918204', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B-118', 'SEC-B', 'GATE-5', 'Demo Fan B', '{"ticket_id":"WC2026-918204","match_code":"NYJ-FRA-ESP-2026"}'),
  ('WC2026-777111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'C-411', 'SEC-C', 'GATE-2', 'Demo Fan C', '{"ticket_id":"WC2026-777111","match_code":"DAL-ENG-ARG-2026"}');

insert into public.volunteers (match_id, display_name, assigned_zone_code, status, skills) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ava Johnson', 'GATE-4', 'available', array['crowd_guidance','english','spanish']),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Miguel Torres', 'FOOD-C', 'available', array['lost_found','spanish','portuguese']),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Priya Shah', 'MED-1', 'busy', array['accessibility','medical_escalation','hindi']);

insert into public.transport_metrics (match_id, parking_utilization, metro_status, bus_delay_minutes, taxi_demand) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 86, 'normal', 4, 'high');

insert into public.sustainability_metrics (match_id, electricity_kwh, water_liters, food_waste_kg, plastic_waste_kg) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6420, 38100, 72, 28);
