-- Calls the queue worker as soon as a notification is due. Rows scheduled for later (quiet hours)
-- and anything this call misses are still delivered by the every-minute cron job.
create or replace function private.invoke_notification_worker()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_url text;
  v_cron_secret text;
begin
  if new.status <> 'pending' or new.scheduled_for > now() then
    return null;
  end if;

  select decrypted_secret into v_project_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_cron_secret from vault.decrypted_secrets where name = 'cron_secret';

  if v_project_url is null or v_cron_secret is null then
    return null;
  end if;

  perform net.http_post(
    url := v_project_url || '/functions/v1/process-notification-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );

  return null;
exception
  -- Never block the insert that queued the notification; the cron job is the fallback.
  when others then
    raise warning 'invoke_notification_worker failed: %', sqlerrm;
    return null;
end;
$$;

revoke all on function private.invoke_notification_worker() from public;

create trigger invoke_notification_worker_on_enqueue
after insert on public.notification_queue
for each row
execute function private.invoke_notification_worker();
