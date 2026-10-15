-- /publicar: organizer submissions + newsletter confirm-mail delivery tracking.
create table if not exists public.cn_submissions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (length(name) between 2 and 120),
  email text not null check (length(email) <= 254),
  event_name text not null check (length(event_name) between 3 and 200),
  kind text not null check (kind in ('hackathon','bounty','grant')),
  location text not null check (length(location) between 2 and 160),
  dates text not null check (length(dates) between 2 and 160),
  prize text check (prize is null or length(prize) <= 160),
  url text not null check (length(url) <= 500 and url ~ '^https?://'),
  notes text check (notes is null or length(notes) <= 2000),
  wants_featured boolean not null default false,
  email_status text not null default 'pending', -- 'sent' | 'failed:<reason>'
  status text not null default 'nuevo'           -- 'nuevo' | 'publicado' | 'descartado'
);
alter table public.cn_submissions enable row level security; -- no policies: only service_role / definer RPCs
revoke all on public.cn_submissions from anon, authenticated;

create or replace function public.cn_submit(p jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  insert into cn_submissions(name,email,event_name,kind,location,dates,prize,url,notes,wants_featured)
  values (p->>'name', lower(p->>'email'), p->>'event_name', p->>'kind', p->>'location', p->>'dates',
          nullif(p->>'prize',''), p->>'url', nullif(p->>'notes',''), coalesce((p->>'wants_featured')::boolean,false))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.cn_submission_mail(sub_id bigint, st text) returns void
language sql security definer set search_path = public as $$
  update cn_submissions set email_status = left(st, 200) where id = sub_id $$;

-- newsletter: remember when the confirm mail could not be sent, to resend once a domain is verified
alter table public.newsletter_subscribers add column if not exists confirm_mail_error text,
  add column if not exists confirm_mail_at timestamptz;
create or replace function public.cn_confirm_mail(confirm_hash text, err text) returns void
language sql security definer set search_path = public as $$
  update newsletter_subscribers set confirm_mail_error = left(err, 200), confirm_mail_at = now()
  where confirm_token_hash = confirm_hash $$;

revoke execute on function public.cn_submit(jsonb), public.cn_submission_mail(bigint,text), public.cn_confirm_mail(text,text) from public, anon, authenticated;
grant execute on function public.cn_submit(jsonb), public.cn_submission_mail(bigint,text), public.cn_confirm_mail(text,text) to service_role;
