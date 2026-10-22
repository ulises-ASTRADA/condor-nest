-- QA only: all fixtures, reservations and simulated payment state are rolled back. No emails or money movement.
begin;
do $$
declare email text := 'qa-featured-' || replace(gen_random_uuid()::text,'-','') || '@example.invalid';
 invite uuid; coupon text; response_id uuid; request_id uuid; p jsonb; a jsonb; b jsonb;
begin
 insert into public.cn_feedback_invitations(submission_id,name,email,token_hash)
 values(4,'Prueba QA',email,encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex')) returning id into invite;
 insert into public.cn_feedback_responses(invitation_id,source,purpose,rating)
 values(invite,'LinkedIn','Publicar o difundir un evento',3) returning id,discount_code into response_id,coupon;
 if public.cn_featured_coupon(coupon,'wrong@example.invalid')->>'status' <> 'invalid' then raise exception 'Email binding failed'; end if;
 if public.cn_featured_coupon(coupon,email)->>'status' <> 'valid' then raise exception 'Valid coupon rejected'; end if;
 p := jsonb_build_object('title','QA destacado','contactEmail',email,'planId','fortnight','start',current_date::text,'coupon',coupon);
 a := public.cn_featured_save(p,encode(sha256(convert_to(email,'UTF8')),'hex'),2900,14::smallint);
 if a->>'status' <> 'saved' or (a#>>'{request,total_cents}')::int <> 2030 then raise exception 'Discount save failed'; end if;
 request_id := (a#>>'{request,id}')::uuid;
 b := public.cn_featured_save(p,encode(sha256(convert_to(email,'UTF8')),'hex'),2900,14::smallint);
 if a#>>'{request,id}' <> b#>>'{request,id}' then raise exception 'Idempotency failed'; end if;
 if (select redeemed_at from public.cn_feedback_responses where id=response_id) is not null then raise exception 'Preview consumed coupon'; end if;
 b := public.cn_featured_save(p,encode(sha256(convert_to(email || 'second','UTF8')),'hex'),2900,14::smallint);
 if b->>'status' <> 'coupon_invalid' then raise exception 'Duplicate reservation allowed'; end if;
 perform public.cn_featured_mail_status(request_id,'contact','sent');
 if (select contact_mail_status from public.cn_featured_requests where id=request_id) <> 'sent' then raise exception 'Mail tracking failed'; end if;
 update public.cn_featured_requests set status='cancelled' where id=request_id;
 if public.cn_featured_coupon(coupon,email)->>'status' <> 'valid' then raise exception 'Cancelled request did not release code'; end if;
 a := public.cn_featured_save(p,encode(sha256(convert_to(email || 'third','UTF8')),'hex'),2900,14::smallint);
 request_id := (a#>>'{request,id}')::uuid;
 perform public.cn_featured_mark_paid(request_id,'QA-ROLLBACK-NOT-A-PAYMENT');
 perform public.cn_featured_mark_paid(request_id,'QA-ROLLBACK-NOT-A-PAYMENT');
 if (select redeemed_at from public.cn_feedback_responses where id=response_id) is null then raise exception 'Payment state did not consume coupon'; end if;
 if public.cn_featured_coupon(coupon,email)->>'status' <> 'invalid' then raise exception 'Redeemed coupon is still valid'; end if;
 if has_table_privilege('anon','public.cn_featured_requests','SELECT') or has_table_privilege('authenticated','public.cn_featured_requests','SELECT') then raise exception 'Public request access'; end if;
 if has_function_privilege('anon','public.cn_featured_save(jsonb,text,integer,smallint)','EXECUTE') then raise exception 'Public RPC access'; end if;
end $$;
rollback;
select 'featured_requests: all transactional checks passed' as result;
