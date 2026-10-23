-- Private bearer links from /publicar to /destacar. Five days = exactly 120 hours.
begin;
create table public.cn_featured_invitations (
  id uuid primary key default gen_random_uuid(),
  submission_id bigint not null references public.cn_submissions(id),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '120 hours'),
  revoked_at timestamptz,
  check (expires_at > created_at)
);
create index cn_featured_invitation_submission on public.cn_featured_invitations(submission_id);
alter table public.cn_featured_invitations enable row level security;
revoke all on public.cn_featured_invitations from public,anon,authenticated;
grant all on public.cn_featured_invitations to service_role;
alter table public.cn_featured_requests
  add column source_submission_id bigint references public.cn_submissions(id),
  add column invitation_id uuid references public.cn_featured_invitations(id),
  add constraint cn_featured_request_source_pair check ((source_submission_id is null) = (invitation_id is null));

-- Operator/service only. Reissuing a link revokes older links for that submission.
create function public.cn_featured_invite_create(p_submission_id bigint,p_token_hash text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare invitation cn_featured_invitations;
begin
  perform 1 from cn_submissions where id=p_submission_id and wants_featured for update;
  if not found then raise exception 'Featured submission not found'; end if;
  update cn_featured_invitations set revoked_at=now() where submission_id=p_submission_id and revoked_at is null;
  insert into cn_featured_invitations(submission_id,token_hash) values(p_submission_id,p_token_hash) returning * into invitation;
  return jsonb_build_object('expires_at',invitation.expires_at);
end $$;

-- Original submission and its invitation commit together, or neither does.
create function public.cn_submit_featured(p jsonb,p_token_hash text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare submission bigint; invitation jsonb;
begin
  if not coalesce((p->>'wants_featured')::boolean,false) then raise exception 'Featured selection required'; end if;
  submission := cn_submit(p);
  if submission=-1 then return jsonb_build_object('id',-1); end if;
  invitation := cn_featured_invite_create(submission,p_token_hash);
  return jsonb_build_object('id',submission,'expires_at',invitation->>'expires_at');
end $$;

create function public.cn_featured_invite_read(p_token_hash text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare invitation cn_featured_invitations; original cn_submissions;
begin
  select * into invitation from cn_featured_invitations where token_hash=p_token_hash and revoked_at is null;
  if not found then return jsonb_build_object('status','invalid'); end if;
  if invitation.expires_at<=now() then return jsonb_build_object('status','expired'); end if;
  select * into original from cn_submissions where id=invitation.submission_id;
  return jsonb_build_object('status','available','expires_at',invitation.expires_at,'submission',jsonb_build_object(
    'name',original.name,'email',original.email,'event_name',original.event_name,'kind',original.kind,
    'location',original.location,'dates',original.dates,'prize',original.prize,'url',original.url,'notes',original.notes));
end $$;

-- Expiry/revocation checked again on save, even if the form was opened earlier.
create function public.cn_featured_save_from_invite(p jsonb,p_fingerprint text,p_subtotal integer,p_days smallint,p_token_hash text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare invitation cn_featured_invitations; result jsonb; saved cn_featured_requests;
begin
  -- Same lock order as reissue: submission, then invitation.
  perform 1 from cn_submissions s join cn_featured_invitations i on i.submission_id=s.id where i.token_hash=p_token_hash for update of s;
  select * into invitation from cn_featured_invitations where token_hash=p_token_hash and revoked_at is null for update;
  if not found then return jsonb_build_object('status','invitation_invalid'); end if;
  if invitation.expires_at<=now() then return jsonb_build_object('status','invitation_expired'); end if;
  result := cn_featured_save(p,p_fingerprint,p_subtotal,p_days);
  if result->>'status'<>'saved' then return result; end if;
  update cn_featured_requests set source_submission_id=invitation.submission_id,invitation_id=invitation.id
    where id=(result#>>'{request,id}')::uuid
      and (invitation_id is null or invitation_id=invitation.id) returning * into saved;
  if not found then raise exception 'Request invitation mismatch'; end if;
  return jsonb_build_object('status','saved','request',to_jsonb(saved));
end $$;
revoke execute on function public.cn_featured_invite_create(bigint,text),public.cn_submit_featured(jsonb,text),public.cn_featured_invite_read(text),public.cn_featured_save_from_invite(jsonb,text,integer,smallint,text) from public,anon,authenticated;
grant execute on function public.cn_featured_invite_create(bigint,text),public.cn_submit_featured(jsonb,text),public.cn_featured_invite_read(text),public.cn_featured_save_from_invite(jsonb,text,integer,smallint,text) to service_role;
commit;
