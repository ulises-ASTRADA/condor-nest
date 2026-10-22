-- Run after 20261022210000_template_mail_dispatch.sql. Test data is rolled back.
begin;
do $$
declare job jsonb; dispatch_id uuid;
begin
  insert into public.cn_template_mail_dispatch(email,template_id,token_hash,expires_at)
  values ('test@example.com',gen_random_uuid(),repeat('a',64),now()+interval '1 minute') returning id into dispatch_id;
  job := public.cn_claim_template_mail(repeat('a',64));
  assert job->>'id' = dispatch_id::text, 'claim failed';
  assert public.cn_claim_template_mail(repeat('a',64)) is null, 'replay allowed';
  perform public.cn_template_mail_delivery(dispatch_id,null);
  assert (select status='sent' from public.cn_template_mail_dispatch where id=dispatch_id), 'delivery failed';
  insert into public.cn_template_mail_dispatch(email,template_id,token_hash,expires_at)
  values ('test@example.com',gen_random_uuid(),repeat('b',64),now()-interval '1 minute');
  assert public.cn_claim_template_mail(repeat('b',64)) is null, 'expiry failed';
  assert not has_function_privilege('anon','public.cn_claim_template_mail(text)','execute'), 'public claim';
  assert not has_function_privilege('authenticated','public.cn_template_mail_delivery(uuid,text)','execute'), 'public delivery';
  assert not has_table_privilege('anon','public.cn_template_mail_dispatch','select,insert,update,delete'), 'public table';
end $$;
rollback;
