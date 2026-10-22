begin;
-- Operator-only dispatches use the existing mail path, preserving consent dates.
alter table public.cn_newsletter_welcome add column dispatch_token_hash text unique check (dispatch_token_hash ~ '^[0-9a-f]{64}$');
alter table public.cn_newsletter_welcome add column dispatch_expires_at timestamptz;

create or replace function public.cn_confirm_with_welcome(confirm_hash text, unsub_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare recipient text; welcome_id uuid;
begin
  if confirm_hash !~ '^[0-9a-f]{64}$' or unsub_hash !~ '^[0-9a-f]{64}$' or confirm_hash is null or unsub_hash is null then
    return jsonb_build_object('status', 'invalid');
  end if;
  -- An operator may authorize one delivery to an already confirmed subscriber.
  -- Only hashes are stored; a short-lived dispatch token is consumed under locks.
  select w.email, w.id into recipient, welcome_id
    from cn_newsletter_welcome w join newsletter_subscribers s on s.email = w.email
    where w.dispatch_token_hash = confirm_hash and w.dispatch_expires_at > now()
      and w.status = 'pending' and s.status = 'confirmed'
    for update of w, s;
  if recipient is not null then
    update cn_newsletter_welcome set dispatch_token_hash = null, dispatch_expires_at = null where id = welcome_id;
    update newsletter_subscribers set unsub_token_hash = unsub_hash where email = recipient;
    return jsonb_build_object('status', 'confirmed', 'welcome', jsonb_build_object('id', welcome_id, 'email', recipient));
  end if;
  -- The row lock acquired by UPDATE makes concurrent confirmation attempts single-use.
  update newsletter_subscribers s
    set status = 'confirmed', confirmed_at = now(), confirm_token_hash = null,
        confirm_expires_at = null, unsub_token_hash = unsub_hash
    where s.confirm_token_hash = confirm_hash and s.confirm_expires_at > now() and s.status = 'pending'
    returning s.email into recipient;
  if recipient is null then return jsonb_build_object('status', 'invalid'); end if;
  insert into cn_newsletter_welcome(email) values(recipient) returning id into welcome_id;
  return jsonb_build_object('status', 'confirmed', 'welcome', jsonb_build_object('id', welcome_id, 'email', recipient));
end;
$$;

commit;
