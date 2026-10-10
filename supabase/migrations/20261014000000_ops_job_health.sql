-- Operations: health of the background job pipeline (outbox → Inngest → AI generation).
-- Aggregates only (no user data), so the API can expose it publicly for uptime checks.

-- Fast lookups of unfinished plans (the pipeline's "stuck" signal).
create index workout_plans_unfinished_idx
  on public.workout_plans (created_at) where status in ('pending', 'generating');
create index diet_plans_unfinished_idx
  on public.diet_plans (created_at) where status in ('pending', 'generating');

create or replace function public.ops_job_health(p_stuck_after interval default interval '15 minutes')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'pendingOutbox',
      (select count(*) from public.outbox_events where dispatched_at is null),
    'oldestPendingOutboxSeconds',
      (select coalesce(extract(epoch from now() - min(created_at))::int, 0)
         from public.outbox_events where dispatched_at is null),
    'lastDispatchedAt',
      (select max(dispatched_at) from public.outbox_events),
    'stuckWorkoutPlans',
      (select count(*) from public.workout_plans
         where status in ('pending', 'generating') and created_at < now() - p_stuck_after),
    'stuckDietPlans',
      (select count(*) from public.diet_plans
         where status in ('pending', 'generating') and created_at < now() - p_stuck_after)
  );
$$;

revoke execute on function public.ops_job_health(interval) from public, anon, authenticated;
grant execute on function public.ops_job_health(interval) to service_role;
