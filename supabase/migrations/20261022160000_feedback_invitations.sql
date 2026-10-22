-- Optional five-question organizer survey. No email is sent by this feature.
begin;
create table public.cn_feedback_invitations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_id bigint not null references public.cn_submissions(id),
  name text not null check (length(name) between 2 and 120),
  email text not null unique check (email = lower(email) and length(email) <= 254),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  revoked_at timestamptz
);
create table public.cn_feedback_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  invitation_id uuid not null unique references public.cn_feedback_invitations(id),
  source text not null check (source in ('Google u otro buscador','LinkedIn','X / Twitter','Instagram','ChatGPT u otra IA','Me lo recomendó alguien','Una comunidad o un evento','Otro lugar')),
  purpose text not null check (purpose in ('Publicar o difundir un evento','Encontrar una oportunidad para participar','Entender qué es una hackatón','Explorar y ver qué hay')),
  rating smallint not null check (rating between 1 and 5),
  useful text check (length(useful) <= 1000),
  improve text check (length(improve) <= 1000),
  discount_code text not null unique default ('NIDO30-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  discount_percent smallint not null default 30 check (discount_percent = 30),
  redeemed_at timestamptz,
  redeemed_event_slug text
);
alter table public.cn_feedback_invitations enable row level security;
alter table public.cn_feedback_responses enable row level security;
revoke all on public.cn_feedback_invitations, public.cn_feedback_responses from public, anon, authenticated;
grant all on public.cn_feedback_invitations, public.cn_feedback_responses to service_role;

create function public.cn_feedback_create_invite(p_submission_id bigint, p_token_hash text) returns uuid
language plpgsql security definer set search_path = public as $$
declare result uuid;
begin
  insert into cn_feedback_invitations(submission_id, name, email, token_hash)
    select id, name, lower(email), p_token_hash from cn_submissions where id = p_submission_id
    returning id into result;
  if result is null then raise exception 'Submission not found'; end if;
  return result;
end $$;

create function public.cn_feedback_status(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare invite_id uuid; coupon text;
begin
  select id into invite_id from cn_feedback_invitations where token_hash = p_token_hash and revoked_at is null;
  if invite_id is null then return jsonb_build_object('status', 'invalid'); end if;
  select discount_code into coupon from cn_feedback_responses where invitation_id = invite_id;
  if coupon is not null then return jsonb_build_object('status', 'completed', 'discount_code', coupon); end if;
  return jsonb_build_object('status', 'available');
end $$;

create function public.cn_feedback_submit(p_token_hash text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare invite_id uuid; coupon text;
begin
  -- Serializes retries and concurrent submissions for this invitation.
  select id into invite_id from cn_feedback_invitations where token_hash = p_token_hash and revoked_at is null for update;
  if invite_id is null then return jsonb_build_object('status', 'invalid'); end if;
  select discount_code into coupon from cn_feedback_responses where invitation_id = invite_id;
  if coupon is null then
    insert into cn_feedback_responses(invitation_id, source, purpose, rating, useful, improve)
      values (invite_id, p_answers->>'source', p_answers->>'purpose', (p_answers->>'rating')::smallint,
        nullif(p_answers->>'useful',''), nullif(p_answers->>'improve','')) returning discount_code into coupon;
  end if;
  return jsonb_build_object('status', 'completed', 'discount_code', coupon);
end $$;
revoke execute on function public.cn_feedback_create_invite(bigint,text), public.cn_feedback_status(text), public.cn_feedback_submit(text,jsonb) from public, anon, authenticated;
grant execute on function public.cn_feedback_create_invite(bigint,text), public.cn_feedback_status(text), public.cn_feedback_submit(text,jsonb) to service_role;
commit;
