-- Helper functions for StadiumMind AI

create or replace function public.verify_demo_ticket(input_ticket_id text, input_match_id uuid)
returns table (
  ticket_id text,
  match_id uuid,
  seat_label text,
  section_code text,
  recommended_gate_code text,
  valid boolean,
  reason text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    t.ticket_id,
    t.match_id,
    t.seat_label,
    t.section_code,
    t.recommended_gate_code,
    (t.match_id = input_match_id and t.is_demo_valid) as valid,
    case
      when t.ticket_id is null then 'Ticket not found in demo database.'
      when t.match_id <> input_match_id then 'Ticket belongs to a different match.'
      when not t.is_demo_valid then 'Ticket is marked invalid in demo database.'
      else 'Ticket verified against demo database.'
    end as reason
  from public.tickets t
  where t.ticket_id = input_ticket_id
  limit 1;
end;
$$;

create or replace function public.log_action_history()
returns trigger
language plpgsql
as $$
begin
  if new.status <> old.status then
    insert into public.action_history (recommendation_id, match_id, action_label, status, outcome_summary)
    values (new.id, new.match_id, new.title, new.status, new.expected_outcome);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recommendation_action_history on public.recommendations;
create trigger trg_recommendation_action_history
after update on public.recommendations
for each row execute function public.log_action_history();
