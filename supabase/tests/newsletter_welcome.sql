-- Run after 20261022193000_newsletter_welcome.sql. No email is sent by SQL.
begin;
do $$
declare first_result jsonb; second_result jsonb; job uuid; test_email text := 'welcome-flow-test@example.invalid';
begin
  perform public.cn_subscribe_v2(test_email, repeat('a',64), repeat('b',64));
  first_result := public.cn_confirm_with_welcome(repeat('a',64),repeat('c',64));
  if first_result->>'status' <> 'confirmed' or first_result#>>'{welcome,email}' <> test_email then raise exception 'confirmation failed'; end if;
  job := (first_result#>>'{welcome,id}')::uuid;
  if not exists(select 1 from newsletter_subscribers where email=test_email and status='confirmed' and confirm_token_hash is null and unsub_token_hash=repeat('c',64)) then raise exception 'subscriber not updated'; end if;
  second_result := public.cn_confirm_with_welcome(repeat('a',64),repeat('d',64));
  if second_result->>'status' <> 'invalid' or second_result ? 'welcome' then raise exception 'repeat confirmation emitted mail'; end if;
  if (select count(*) from cn_newsletter_welcome where email=test_email) <> 1 then raise exception 'duplicate job'; end if;
  perform public.cn_welcome_delivery(job, 'network');
  if not exists(select 1 from cn_newsletter_welcome where id=job and status='failed') then raise exception 'failure not recorded'; end if;
  perform public.cn_welcome_delivery(job, null);
  perform public.cn_welcome_delivery(job, 'late_error');
  if not exists(select 1 from cn_newsletter_welcome where id=job and status='sent' and sent_at is not null and last_error is null) then raise exception 'sent status overwritten'; end if;
  perform public.cn_subscribe_v2('welcome-expired-test@example.invalid', repeat('e',64), repeat('f',64));
  update newsletter_subscribers set confirm_expires_at=now()-interval '1 second' where email='welcome-expired-test@example.invalid';
  if public.cn_confirm_with_welcome(repeat('e',64),repeat('f',64))->>'status' <> 'invalid' then raise exception 'expired accepted'; end if;
  if has_function_privilege('anon','public.cn_confirm_with_welcome(text,text)','execute') or has_function_privilege('authenticated','public.cn_welcome_delivery(uuid,text)','execute') or has_table_privilege('anon','public.cn_newsletter_welcome','select') then raise exception 'public access granted'; end if;
end;
$$;
do $$
declare job uuid; result jsonb; original_confirmed timestamptz;
begin
  select confirmed_at into original_confirmed from newsletter_subscribers where email='welcome-flow-test@example.invalid';
  insert into cn_newsletter_welcome(email,dispatch_token_hash,dispatch_expires_at)
    values('welcome-flow-test@example.invalid',repeat('1',64),now()+interval '1 hour') returning id into job;
  result := cn_confirm_with_welcome(repeat('1',64),repeat('2',64));
  if result->>'status' <> 'confirmed' or (result#>>'{welcome,id}')::uuid <> job then raise exception 'operator dispatch failed'; end if;
  if not exists(select 1 from newsletter_subscribers where email='welcome-flow-test@example.invalid' and status='confirmed' and confirmed_at=original_confirmed) then raise exception 'consent date changed'; end if;
  if cn_confirm_with_welcome(repeat('1',64),repeat('3',64))->>'status' <> 'invalid' then raise exception 'dispatch replay accepted'; end if;
  insert into cn_newsletter_welcome(email,dispatch_token_hash,dispatch_expires_at)
    values('welcome-expired-test@example.invalid',repeat('4',64),now()+interval '1 hour');
  if cn_confirm_with_welcome(repeat('4',64),repeat('5',64))->>'status' <> 'invalid' then raise exception 'unconfirmed dispatched'; end if;
end; $$;
select 'newsletter_welcome: all transactional checks passed' as result;
rollback;
