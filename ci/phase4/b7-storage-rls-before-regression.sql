\set ON_ERROR_STOP on
-- POSITIVE REPRODUCTION: an anonymous user must currently be able to
-- read/mutate a synthetic private-editorial object via the unintended
-- broad permissive B5 policy. This deliberately FAILS if vulnerability
-- no longer exists, forcing a new independent security review.
begin;
set local role anon;
do $before$
declare v_count integer;v_rows integer;
begin
 select count(*) into v_count from storage.objects
 where bucket_id='private-editorial';
 if v_count<>1 then raise exception 'BROAD_STORAGE_POLICY_NOT_REPRODUCED_READ';end if;
 update storage.objects set contents='synthetic_anonymous_modified'
 where bucket_id='private-editorial' and id=12;
 get diagnostics v_rows=row_count;
 if v_rows<>1 then raise exception 'BROAD_STORAGE_POLICY_NOT_REPRODUCED_WRITE';end if;
 insert into storage.objects(id,bucket_id,name)
 values(14,'private-editorial','synthetic_anonymous_insert.pdf');
 delete from storage.objects where bucket_id='private-editorial' and id=14;
 get diagnostics v_rows=row_count;
 if v_rows<>1 then raise exception 'BROAD_STORAGE_POLICY_NOT_REPRODUCED_DELETE';end if;
 select count(*) into v_count from storage.objects
 where bucket_id='grievance-private';
 if v_count<>0 then raise exception 'GRIEVANCE_PRIVATE_FIXTURE_LEAKED';end if;
 raise notice 'CONFIRMED [ADS-056 ROOT CAUSE] broad permissive B5 policy lets anon SELECT/UPDATE/INSERT/DELETE private-editorial synthetic object; grievance still protected';
end $before$;
rollback;
