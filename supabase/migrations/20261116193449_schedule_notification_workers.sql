create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Jobs read the 'project_url' and 'cron_secret' Vault secrets and do nothing until both exist.
select cron.schedule(
  'process-notification-queue',
  '* * * * *',
  $$
  select net.http_post(
    url := project_url.decrypted_secret || '/functions/v1/process-notification-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret.decrypted_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  from vault.decrypted_secrets as project_url
  cross join vault.decrypted_secrets as cron_secret
  where project_url.name = 'project_url'
    and cron_secret.name = 'cron_secret';
  $$
);

select cron.schedule(
  'check-push-receipts',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := project_url.decrypted_secret || '/functions/v1/check-push-receipts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret.decrypted_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  from vault.decrypted_secrets as project_url
  cross join vault.decrypted_secrets as cron_secret
  where project_url.name = 'project_url'
    and cron_secret.name = 'cron_secret';
  $$
);
