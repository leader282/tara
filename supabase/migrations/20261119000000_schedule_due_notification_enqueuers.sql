-- Capsule-unlock and ritual-reminder notifications come from service-role functions that
-- nothing ever called, so neither kind was ever queued. Both dedupe per recipient, and
-- enqueue_notification already defers anything that would land in quiet hours.

select cron.schedule(
  'enqueue-capsule-unlock-notifications',
  '* * * * *',
  $$ select public.enqueue_due_capsule_unlock_notifications(); $$
);

-- One gentle nudge a day (19:00 IST) for whoever hasn't answered today's ritual yet.
select cron.schedule(
  'enqueue-ritual-reminders',
  '30 13 * * *',
  $$ select public.enqueue_due_ritual_reminders(); $$
);
