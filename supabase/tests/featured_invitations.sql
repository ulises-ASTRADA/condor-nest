-- Transactional verification only: all fixtures rolled back; no mail or real payment.
begin;
do $$
declare submission bigint; qa_email text := 'qa-invite-' || replace(gen_random_uuid()::text,'-','') || '@example.invalid';
 hash1 text := encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex');
 hash2 text := encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex');
 original jsonb; answer jsonb; second jsonb; details jsonb; request_id uuid;
begin
 original:=jsonb_build_object('name','Persona QA','email',qa_email,'event_name','Evento QA privado','kind','hackathon',
   'location','Online','dates','Fechas libres sin interpretar','prize','Sin premio','url','https://example.invalid/evento','notes','Notas originales','wants_featured',true);
 answer:=cn_submit_featured(original,hash1); submission:=(answer->>'id')::bigint;
 if submission=-1 then raise exception 'Test blocked by existing submission caps'; end if;
 if not exists(select 1 from cn_featured_invitations where submission_id=submission and token_hash=hash1 and expires_at-created_at=interval '120 hours') then raise exception 'Five-day expiry missing'; end if;
 answer:=cn_featured_invite_read(hash1);
 if answer->>'status'<>'available' or answer#>>'{submission,email}'<>qa_email or answer#>>'{submission,dates}'<>'Fechas libres sin interpretar' then raise exception 'Prefill data missing'; end if;
 if cn_featured_invite_read(repeat('f',64))->>'status'<>'invalid' then raise exception 'Unknown token accepted'; end if;
 details:=jsonb_build_object('title','Evento QA editado','contactEmail',qa_email,'planId','fortnight','start',current_date::text,'coupon','');
 answer:=cn_featured_save_from_invite(details,hash1,2900,14::smallint,hash1);
 if answer->>'status'<>'saved' or (answer#>>'{request,source_submission_id}')::bigint<>submission then raise exception 'Original submission association failed'; end if;
 request_id:=(answer#>>'{request,id}')::uuid;
 second:=cn_featured_save_from_invite(details,hash1,2900,14::smallint,hash1);
 if second#>>'{request,id}'<>request_id::text then raise exception 'Retry duplicated request'; end if;
 if (select event_name from cn_submissions where id=submission)<>'Evento QA privado' then raise exception 'Original submission overwritten'; end if;
 perform cn_featured_invite_create(submission,hash2);
 if cn_featured_invite_read(hash1)->>'status'<>'invalid' then raise exception 'Previous link was not revoked'; end if;
 if cn_featured_save_from_invite(details,hash2,2900,14::smallint,hash1)->>'status'<>'invitation_invalid' then raise exception 'Revoked token saved'; end if;
 update cn_featured_invitations set created_at=now()-interval '6 days',expires_at=now() where token_hash=hash2;
 answer:=cn_featured_invite_read(hash2);
 if answer->>'status'<>'expired' or answer ? 'submission' then raise exception 'Expired token leaks data'; end if;
 if cn_featured_save_from_invite(details,hash2,2900,14::smallint,hash2)->>'status'<>'invitation_expired' then raise exception 'Expired open form saved'; end if;
 if exists(select 1 from cn_featured_requests where fingerprint=hash2) then raise exception 'Expired request persisted'; end if;
 -- A failing invitation must roll back the original submission as well.
 begin
   perform cn_submit_featured(original || jsonb_build_object('event_name','QA atomic rollback'),'not-a-hash');
   raise exception 'Invalid hash accepted';
 exception when check_violation then null;
 end;
 if exists(select 1 from cn_submissions where email=qa_email and event_name='QA atomic rollback') then raise exception 'Atomic rollback failed'; end if;
 if has_table_privilege('anon','public.cn_featured_invitations','SELECT') or has_table_privilege('authenticated','public.cn_featured_invitations','SELECT') then raise exception 'Public invitation table access'; end if;
 if has_function_privilege('anon','public.cn_featured_invite_read(text)','EXECUTE') or has_function_privilege('authenticated','public.cn_submit_featured(jsonb,text)','EXECUTE') or has_function_privilege('anon','public.cn_featured_save_from_invite(jsonb,text,integer,smallint,text)','EXECUTE') then raise exception 'Public RPC access'; end if;
end $$;
rollback;
select 'featured_invitations: all transactional checks passed' as result;
