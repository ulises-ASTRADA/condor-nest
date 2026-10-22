begin;
alter table public.cn_feedback_responses add column source_other text;
alter table public.cn_feedback_responses add constraint cn_feedback_source_other_check check (
  (source = 'Otro lugar' and source_other is not null and length(trim(source_other)) between 1 and 200)
  or (source <> 'Otro lugar' and source_other is null)
);
create or replace function public.cn_feedback_submit(p_token_hash text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare invite_id uuid; coupon text;
begin
  select id into invite_id from cn_feedback_invitations where token_hash = p_token_hash and revoked_at is null for update;
  if invite_id is null then return jsonb_build_object('status', 'invalid'); end if;
  select discount_code into coupon from cn_feedback_responses where invitation_id = invite_id;
  if coupon is null then
    insert into cn_feedback_responses(invitation_id, source, source_other, purpose, rating, useful, improve)
      values (invite_id, p_answers->>'source', p_answers->>'source_other', p_answers->>'purpose', (p_answers->>'rating')::smallint,
        nullif(p_answers->>'useful',''), nullif(p_answers->>'improve','')) returning discount_code into coupon;
  end if;
  return jsonb_build_object('status', 'completed', 'discount_code', coupon);
end $$;
revoke execute on function public.cn_feedback_submit(text,jsonb) from public, anon, authenticated;
grant execute on function public.cn_feedback_submit(text,jsonb) to service_role;
commit;
