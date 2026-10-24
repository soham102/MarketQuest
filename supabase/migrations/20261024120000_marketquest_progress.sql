-- MarketQuest: user profiles, learning progress and simulation persistence.
--
-- Security model
--   * Every user-owned row carries user_id, defaulting to auth.uid().
--   * Row Level Security is enabled on every table; policies compare user_id with auth.uid().
--   * Child tables reference (session_id, user_id) on simulation_sessions, so a row can
--     never point at another user's session even if a client sends a forged session id.
--   * save_progress / load_progress are SECURITY INVOKER: they run as the calling user,
--     so RLS still applies, and they derive ownership from auth.uid() — any user id
--     inside the payload is ignored.
--
-- Idempotency
--   * Orders and rounds are immutable facts keyed by (session_id, txn_id) / (session_id, round):
--     replays insert nothing new.
--   * Mutable session state only moves forward: an update is applied only when the incoming
--     progress_rank is strictly greater than the stored one, so a stale tab or device
--     cannot roll progress back.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a profile automatically for every new auth user (Google sign-up included).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Learning progress
-- ---------------------------------------------------------------------------
create table public.concept_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  concept_slug text not null check (char_length(concept_slug) between 1 and 80),
  status text not null check (status in ('in-progress', 'completed')),
  step smallint not null default 0 check (step between 0 and 20),
  -- First-attempt answers: { "<questionId>": { "answer": n, "correct": bool } }
  quiz jsonb not null default '{}'::jsonb check (jsonb_typeof(quiz) = 'object' and pg_column_size(quiz) < 16384),
  opened_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_slug)
);

create table public.achievements (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement_id text not null check (char_length(achievement_id) between 1 and 80),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- Simulation
-- ---------------------------------------------------------------------------
create table public.simulation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- The engine's startedAt timestamp (ms); identifies the same run across devices.
  client_started_at bigint not null check (client_started_at > 0),
  risk_profile text not null check (risk_profile in ('cautious', 'balanced', 'growth')),
  status text not null check (status in ('in-progress', 'completed')),
  current_round smallint not null check (current_round between 1 and 10),
  phase text not null check (phase in ('decision', 'debrief')),
  cash_paise bigint not null check (cash_paise >= 0),
  realized_pnl_paise bigint not null default 0,
  charges_paise bigint not null default 0 check (charges_paise >= 0),
  prices jsonb not null check (jsonb_typeof(prices) = 'object'),
  price_history jsonb not null check (jsonb_typeof(price_history) = 'object' and pg_column_size(price_history) < 262144),
  value_history jsonb not null check (jsonb_typeof(value_history) = 'array'),
  -- Monotonic progress marker computed by the client (see src/lib/sync/mapping.ts).
  progress_rank integer not null check (progress_rank >= 0),
  final_value_paise bigint,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_started_at),
  -- Target for composite foreign keys from child tables.
  unique (id, user_id)
);

create index simulation_sessions_user_latest_idx
  on public.simulation_sessions (user_id, client_started_at desc);

create table public.holdings (
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  ticker text not null check (ticker ~ '^[A-Z]{2,8}$'),
  quantity integer not null check (quantity > 0),
  cost_basis_paise bigint not null check (cost_basis_paise >= 0),
  primary key (session_id, ticker),
  foreign key (session_id, user_id) references public.simulation_sessions (id, user_id) on delete cascade
);

create index holdings_user_idx on public.holdings (user_id);

create table public.sim_orders (
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  -- Deterministic engine transaction id, e.g. "r3-t2"; makes replays idempotent.
  txn_id text not null check (char_length(txn_id) between 1 and 40),
  round smallint not null check (round between 1 and 10),
  ticker text not null check (ticker ~ '^[A-Z]{2,8}$'),
  side text not null check (side in ('buy', 'sell')),
  quantity integer not null check (quantity > 0),
  price_paise bigint not null check (price_paise > 0),
  value_paise bigint not null check (value_paise > 0),
  charges_paise bigint not null check (charges_paise >= 0),
  realized_pnl_paise bigint not null default 0,
  created_at timestamptz not null default now(),
  primary key (session_id, txn_id),
  foreign key (session_id, user_id) references public.simulation_sessions (id, user_id) on delete cascade
);

create index sim_orders_user_idx on public.sim_orders (user_id);
create index sim_orders_session_round_idx on public.sim_orders (session_id, round);

create table public.round_history (
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  round smallint not null check (round between 1 and 10),
  path_id text not null,
  rationale_id text not null,
  risk_id text not null,
  value_start_paise bigint not null,
  value_before_paise bigint not null,
  value_after_paise bigint not null,
  knowledge_check_answer smallint check (knowledge_check_answer between 0 and 9),
  scores jsonb not null check (jsonb_typeof(scores) = 'object'),
  -- Full engine RoundRecord (prices, pre-trade snapshot) so debriefs replay exactly.
  record jsonb not null check (jsonb_typeof(record) = 'object' and pg_column_size(record) < 65536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, round),
  foreign key (session_id, user_id) references public.simulation_sessions (id, user_id) on delete cascade
);

create index round_history_user_idx on public.round_history (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.concept_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.simulation_sessions enable row level security;
alter table public.holdings enable row level security;
alter table public.sim_orders enable row level security;
alter table public.round_history enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Identical owner-only policies for every user_id table.
do $$
declare
  t text;
begin
  foreach t in array array['concept_progress', 'achievements', 'simulation_sessions', 'holdings', 'sim_orders', 'round_history']
  loop
    execute format('create policy "%1$s: read own" on public.%1$I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s: insert own" on public.%1$I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s: update own" on public.%1$I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s: delete own" on public.%1$I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- Anonymous visitors get nothing; signed-in users get table access filtered by RLS.
revoke all on public.profiles, public.concept_progress, public.achievements, public.simulation_sessions,
  public.holdings, public.sim_orders, public.round_history from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.concept_progress, public.achievements, public.simulation_sessions,
  public.holdings, public.sim_orders, public.round_history to authenticated;

-- ---------------------------------------------------------------------------
-- save_progress: one atomic, idempotent write of the client's state
-- ---------------------------------------------------------------------------
create function public.save_progress(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sim jsonb := payload -> 'simulation';
  v_session_id uuid;
  v_stored_rank integer;
  v_incoming_rank integer;
  v_applied boolean := false;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Profile (insert if the auth trigger hasn't, never downgrade onboarding).
  insert into public.profiles (id, onboarded)
  values (v_uid, coalesce((payload ->> 'onboarded')::boolean, false))
  on conflict (id) do update
    set onboarded = public.profiles.onboarded or excluded.onboarded,
        updated_at = now();

  -- Concepts: completed is never downgraded; first quiz answers are never overwritten.
  insert into public.concept_progress (user_id, concept_slug, status, step, quiz, opened_at, completed_at)
  select v_uid, c.slug, c.status, c.step, coalesce(c.quiz, '{}'::jsonb),
         coalesce(to_timestamp(c.opened_at / 1000.0), now()),
         case when c.completed_at is null then null else to_timestamp(c.completed_at / 1000.0) end
  from jsonb_to_recordset(coalesce(payload -> 'concepts', '[]'::jsonb))
    as c(slug text, status text, step smallint, quiz jsonb, opened_at double precision, completed_at double precision)
  on conflict (user_id, concept_slug) do update
    set status = case when public.concept_progress.status = 'completed' or excluded.status = 'completed'
                      then 'completed' else 'in-progress' end,
        step = greatest(public.concept_progress.step, excluded.step),
        quiz = excluded.quiz || public.concept_progress.quiz,
        opened_at = least(public.concept_progress.opened_at, excluded.opened_at),
        completed_at = coalesce(public.concept_progress.completed_at, excluded.completed_at),
        updated_at = now();

  insert into public.achievements (user_id, achievement_id, unlocked_at)
  select v_uid, a.id, to_timestamp(a.unlocked_at / 1000.0)
  from jsonb_to_recordset(coalesce(payload -> 'achievements', '[]'::jsonb)) as a(id text, unlocked_at double precision)
  on conflict (user_id, achievement_id) do nothing;

  if v_sim is not null and jsonb_typeof(v_sim) = 'object' then
    v_incoming_rank := (v_sim ->> 'progress_rank')::integer;

    select id, progress_rank into v_session_id, v_stored_rank
    from public.simulation_sessions
    where user_id = v_uid and client_started_at = (v_sim ->> 'client_started_at')::bigint
    for update;

    if v_session_id is null then
      insert into public.simulation_sessions (
        user_id, client_started_at, risk_profile, status, current_round, phase, cash_paise,
        realized_pnl_paise, charges_paise, prices, price_history, value_history, progress_rank,
        final_value_paise, completed_at)
      values (
        v_uid, (v_sim ->> 'client_started_at')::bigint, v_sim ->> 'risk_profile', v_sim ->> 'status',
        (v_sim ->> 'current_round')::smallint, v_sim ->> 'phase', (v_sim ->> 'cash_paise')::bigint,
        (v_sim ->> 'realized_pnl_paise')::bigint, (v_sim ->> 'charges_paise')::bigint,
        v_sim -> 'prices', v_sim -> 'price_history', v_sim -> 'value_history', v_incoming_rank,
        (v_sim ->> 'final_value_paise')::bigint,
        case when v_sim ->> 'status' = 'completed' then now() end)
      on conflict (user_id, client_started_at) do nothing
      returning id into v_session_id;

      if v_session_id is null then
        -- A concurrent request created it first; treat this write as stale.
        select id, progress_rank into v_session_id, v_stored_rank
        from public.simulation_sessions
        where user_id = v_uid and client_started_at = (v_sim ->> 'client_started_at')::bigint;
      else
        v_applied := true;
        v_stored_rank := v_incoming_rank;
      end if;
    elsif v_incoming_rank > v_stored_rank then
      update public.simulation_sessions
        set status = v_sim ->> 'status',
            current_round = (v_sim ->> 'current_round')::smallint,
            phase = v_sim ->> 'phase',
            cash_paise = (v_sim ->> 'cash_paise')::bigint,
            realized_pnl_paise = (v_sim ->> 'realized_pnl_paise')::bigint,
            charges_paise = (v_sim ->> 'charges_paise')::bigint,
            prices = v_sim -> 'prices',
            price_history = v_sim -> 'price_history',
            value_history = v_sim -> 'value_history',
            progress_rank = v_incoming_rank,
            final_value_paise = (v_sim ->> 'final_value_paise')::bigint,
            completed_at = case when v_sim ->> 'status' = 'completed' then coalesce(completed_at, now()) end,
            updated_at = now()
      where id = v_session_id;
      v_applied := true;
      v_stored_rank := v_incoming_rank;
    end if;

    if v_applied then
      -- Holdings are current state: replace them only when the session state was accepted.
      delete from public.holdings where session_id = v_session_id;
      insert into public.holdings (session_id, user_id, ticker, quantity, cost_basis_paise)
      select v_session_id, v_uid, h.ticker, h.quantity, h.cost_basis_paise
      from jsonb_to_recordset(coalesce(v_sim -> 'holdings', '[]'::jsonb))
        as h(ticker text, quantity integer, cost_basis_paise bigint)
      where h.quantity > 0;

      -- Orders and rounds are immutable facts: replays insert nothing new.
      insert into public.sim_orders (session_id, user_id, txn_id, round, ticker, side, quantity, price_paise,
                                     value_paise, charges_paise, realized_pnl_paise)
      select v_session_id, v_uid, o.txn_id, o.round, o.ticker, o.side, o.quantity, o.price_paise,
             o.value_paise, o.charges_paise, o.realized_pnl_paise
      from jsonb_to_recordset(coalesce(v_sim -> 'orders', '[]'::jsonb))
        as o(txn_id text, round smallint, ticker text, side text, quantity integer, price_paise bigint,
             value_paise bigint, charges_paise bigint, realized_pnl_paise bigint)
      on conflict (session_id, txn_id) do nothing;

      insert into public.round_history (session_id, user_id, round, path_id, rationale_id, risk_id,
                                        value_start_paise, value_before_paise, value_after_paise,
                                        knowledge_check_answer, scores, record)
      select v_session_id, v_uid, r.round, r.path_id, r.rationale_id, r.risk_id, r.value_start_paise,
             r.value_before_paise, r.value_after_paise, r.knowledge_check_answer, r.scores, r.record
      from jsonb_to_recordset(coalesce(v_sim -> 'rounds', '[]'::jsonb))
        as r(round smallint, path_id text, rationale_id text, risk_id text, value_start_paise bigint,
             value_before_paise bigint, value_after_paise bigint, knowledge_check_answer smallint,
             scores jsonb, record jsonb)
      on conflict (session_id, round) do update
        -- Only the first knowledge-check answer counts; everything else about a round is fixed.
        set knowledge_check_answer = excluded.knowledge_check_answer,
            scores = excluded.scores,
            record = excluded.record,
            updated_at = now()
        where public.round_history.knowledge_check_answer is null
          and excluded.knowledge_check_answer is not null;
    end if;
  end if;

  return jsonb_build_object(
    'simulation_applied', v_applied,
    'session_id', v_session_id,
    'stored_rank', v_stored_rank
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- load_progress: everything needed to restore the caller's state
-- ---------------------------------------------------------------------------
create function public.load_progress()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.simulation_sessions;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_session
  from public.simulation_sessions
  where user_id = v_uid
  order by client_started_at desc
  limit 1;

  return jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'concepts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', c.concept_slug, 'status', c.status, 'step', c.step, 'quiz', c.quiz,
        'opened_at', floor(extract(epoch from c.opened_at) * 1000),
        'completed_at', case when c.completed_at is null then null else floor(extract(epoch from c.completed_at) * 1000) end))
      from public.concept_progress c where c.user_id = v_uid), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.achievement_id, 'unlocked_at', floor(extract(epoch from a.unlocked_at) * 1000)))
      from public.achievements a where a.user_id = v_uid), '[]'::jsonb),
    'simulation', case when v_session.id is null then null else
      to_jsonb(v_session) || jsonb_build_object(
        'holdings', coalesce((
          select jsonb_agg(jsonb_build_object('ticker', h.ticker, 'quantity', h.quantity, 'cost_basis_paise', h.cost_basis_paise))
          from public.holdings h where h.session_id = v_session.id), '[]'::jsonb),
        'orders', coalesce((
          select jsonb_agg(to_jsonb(o) - 'user_id' - 'session_id' order by o.round, o.txn_id)
          from public.sim_orders o where o.session_id = v_session.id), '[]'::jsonb),
        'rounds', coalesce((
          select jsonb_agg(jsonb_build_object('round', r.round, 'knowledge_check_answer', r.knowledge_check_answer,
                                              'scores', r.scores, 'record', r.record) order by r.round)
          from public.round_history r where r.session_id = v_session.id), '[]'::jsonb))
    end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_my_progress: let users erase their own saved progress (profile is kept)
-- ---------------------------------------------------------------------------
create function public.delete_my_progress()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from public.simulation_sessions where user_id = v_uid; -- cascades to holdings, orders, rounds
  delete from public.concept_progress where user_id = v_uid;
  delete from public.achievements where user_id = v_uid;
  update public.profiles set onboarded = false, updated_at = now() where id = v_uid;
end;
$$;

revoke all on function public.delete_my_progress() from public, anon;
grant execute on function public.delete_my_progress() to authenticated;

revoke all on function public.save_progress(jsonb) from public, anon;
revoke all on function public.load_progress() from public, anon;
grant execute on function public.save_progress(jsonb) to authenticated;
grant execute on function public.load_progress() to authenticated;
