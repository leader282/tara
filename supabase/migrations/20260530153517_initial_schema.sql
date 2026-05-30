create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  timezone text,
  birthday date,
  city text,
  country text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length_check
    check (char_length(btrim(display_name)) between 1 and 80),
  constraint profiles_timezone_length_check
    check (timezone is null or char_length(timezone) <= 100),
  constraint profiles_city_length_check
    check (city is null or char_length(city) <= 120),
  constraint profiles_country_length_check
    check (country is null or char_length(country) <= 120)
);

create table public.couples (
  id uuid primary key default extensions.gen_random_uuid(),
  status text not null default 'active',
  anniversary_date date,
  next_meetup_at timestamptz,
  next_meetup_location text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couples_status_check
    check (status in ('active', 'archived')),
  constraint couples_next_meetup_location_length_check
    check (
      next_meetup_location is null
      or char_length(next_meetup_location) <= 160
    )
);

create table public.couple_members (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'partner',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  constraint couple_members_role_check
    check (role in ('partner')),
  constraint couple_members_status_check
    check (status in ('active', 'left', 'removed')),
  constraint couple_members_couple_id_user_id_key
    unique (couple_id, user_id)
);

create table public.couple_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  invite_code text not null,
  status text not null default 'active',
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint couple_invites_invite_code_key
    unique (invite_code),
  constraint couple_invites_status_check
    check (status in ('active', 'accepted', 'revoked', 'expired')),
  constraint couple_invites_expires_at_check
    check (expires_at > created_at),
  constraint couple_invites_invite_code_length_check
    check (char_length(invite_code) between 16 and 128)
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quiet_hours_start time,
  quiet_hours_end time,
  notification_tone text,
  preferred_love_signals text[] not null default '{}',
  emotional_tone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.couple_settings (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  theme text,
  ritual_frequency text not null default 'daily',
  privacy_level text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couple_settings_ritual_frequency_check
    check (ritual_frequency in ('daily', 'few_times_week', 'weekly')),
  constraint couple_settings_privacy_level_check
    check (privacy_level in ('private'))
);

create table public.media_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  media_type text not null,
  mime_type text not null,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  constraint media_assets_storage_path_key
    unique (storage_path),
  constraint media_assets_media_type_check
    check (media_type in ('image')),
  constraint media_assets_size_bytes_check
    check (size_bytes is null or size_bytes > 0),
  constraint media_assets_storage_path_length_check
    check (char_length(storage_path) <= 512)
);

create table public.presence_events (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  optional_message text,
  created_at timestamptz not null default now(),
  constraint presence_events_type_check
    check (
      type in (
        'thinking_of_you',
        'miss_you',
        'hug',
        'good_morning',
        'good_night',
        'safe_arrived',
        'proud_of_you'
      )
    ),
  constraint presence_events_optional_message_length_check
    check (
      optional_message is null
      or char_length(optional_message) <= 240
    )
);

create table public.ritual_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  prompt text not null,
  input_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ritual_templates_input_type_check
    check (input_type in ('text', 'photo', 'text_or_photo')),
  constraint ritual_templates_title_length_check
    check (char_length(title) between 1 and 120),
  constraint ritual_templates_prompt_length_check
    check (char_length(prompt) between 1 and 500)
);

create table public.couple_rituals (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  ritual_template_id uuid not null references public.ritual_templates(id),
  scheduled_for date not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couple_rituals_status_check
    check (status in ('scheduled', 'completed', 'skipped')),
  constraint couple_rituals_couple_id_scheduled_for_key
    unique (couple_id, scheduled_for)
);

create table public.ritual_completions (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_ritual_id uuid not null references public.couple_rituals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text_response text,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ritual_completions_couple_ritual_id_user_id_key
    unique (couple_ritual_id, user_id),
  constraint ritual_completions_text_response_length_check
    check (
      text_response is null
      or char_length(text_response) <= 1000
    )
);

create table public.memory_capsules (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  unlock_type text not null default 'date',
  unlock_at timestamptz not null,
  emotional_context text,
  opened_by uuid references auth.users(id),
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memory_capsules_unlock_type_check
    check (unlock_type in ('date')),
  constraint memory_capsules_title_length_check
    check (char_length(btrim(title)) between 1 and 120),
  constraint memory_capsules_emotional_context_length_check
    check (
      emotional_context is null
      or char_length(emotional_context) <= 240
    )
);

create table public.memory_capsule_contents (
  capsule_id uuid primary key references public.memory_capsules(id) on delete cascade,
  note text,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memory_capsule_contents_note_length_check
    check (note is null or char_length(note) <= 5000)
);

create table public.timeline_items (
  id uuid primary key default extensions.gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  title text not null,
  subtitle text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint timeline_items_type_check
    check (
      type in (
        'presence_sent',
        'ritual_completed',
        'capsule_created',
        'capsule_opened',
        'countdown_updated',
        'parallel_moment_completed'
      )
    ),
  constraint timeline_items_title_length_check
    check (char_length(title) between 1 and 160),
  constraint timeline_items_subtitle_length_check
    check (subtitle is null or char_length(subtitle) <= 240),
  constraint timeline_items_payload_object_check
    check (jsonb_typeof(payload) = 'object')
);

create table public.push_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_token_key
    unique (token),
  constraint push_tokens_platform_check
    check (platform in ('ios', 'android'))
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  presence_enabled boolean not null default true,
  rituals_enabled boolean not null default true,
  capsules_enabled boolean not null default true,
  countdown_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_couples_updated_at
before update on public.couples
for each row
execute function public.set_updated_at();

create trigger set_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

create trigger set_couple_settings_updated_at
before update on public.couple_settings
for each row
execute function public.set_updated_at();

create trigger set_couple_rituals_updated_at
before update on public.couple_rituals
for each row
execute function public.set_updated_at();

create trigger set_ritual_completions_updated_at
before update on public.ritual_completions
for each row
execute function public.set_updated_at();

create trigger set_memory_capsules_updated_at
before update on public.memory_capsules
for each row
execute function public.set_updated_at();

create trigger set_memory_capsule_contents_updated_at
before update on public.memory_capsule_contents
for each row
execute function public.set_updated_at();

create trigger set_push_tokens_updated_at
before update on public.push_tokens
for each row
execute function public.set_updated_at();

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

create index couple_members_active_user_id_idx
  on public.couple_members(user_id)
  where status = 'active';

create index couple_members_active_couple_id_idx
  on public.couple_members(couple_id)
  where status = 'active';

create unique index couple_members_one_active_couple_per_user_idx
  on public.couple_members(user_id)
  where status = 'active';

create index couple_invites_couple_id_status_idx
  on public.couple_invites(couple_id, status);

create index presence_events_couple_id_created_at_idx
  on public.presence_events(couple_id, created_at desc);

create index couple_rituals_couple_id_scheduled_for_idx
  on public.couple_rituals(couple_id, scheduled_for desc);

create index ritual_completions_couple_ritual_id_idx
  on public.ritual_completions(couple_ritual_id);

create index memory_capsules_couple_id_unlock_at_idx
  on public.memory_capsules(couple_id, unlock_at);

create index timeline_items_couple_id_created_at_idx
  on public.timeline_items(couple_id, created_at desc);

create index media_assets_couple_id_idx
  on public.media_assets(couple_id);

create index push_tokens_user_id_idx
  on public.push_tokens(user_id);

create or replace function public.enforce_max_two_active_couple_members()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  active_member_count integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  perform 1
  from public.couples
  where id = new.couple_id
  for update;

  select count(*)
  into active_member_count
  from public.couple_members
  where couple_id = new.couple_id
    and status = 'active'
    and (tg_op = 'INSERT' or id <> new.id);

  if active_member_count >= 2 then
    raise exception 'A couple can have at most two active members'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_max_two_active_couple_members
before insert or update on public.couple_members
for each row
execute function public.enforce_max_two_active_couple_members();

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.user_settings enable row level security;
alter table public.couple_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.presence_events enable row level security;
alter table public.ritual_templates enable row level security;
alter table public.couple_rituals enable row level security;
alter table public.ritual_completions enable row level security;
alter table public.memory_capsules enable row level security;
alter table public.memory_capsule_contents enable row level security;
alter table public.timeline_items enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_preferences enable row level security;

revoke all on table
  public.profiles,
  public.couples,
  public.couple_members,
  public.couple_invites,
  public.user_settings,
  public.couple_settings,
  public.media_assets,
  public.presence_events,
  public.ritual_templates,
  public.couple_rituals,
  public.ritual_completions,
  public.memory_capsules,
  public.memory_capsule_contents,
  public.timeline_items,
  public.push_tokens,
  public.notification_preferences
from anon;

grant usage on schema public to authenticated;

grant select, insert, update on table
  public.profiles,
  public.couples,
  public.couple_members,
  public.couple_invites,
  public.user_settings,
  public.couple_settings,
  public.media_assets,
  public.couple_rituals,
  public.ritual_completions,
  public.memory_capsules,
  public.memory_capsule_contents,
  public.push_tokens,
  public.notification_preferences
to authenticated;

grant select, insert on table
  public.presence_events,
  public.timeline_items
to authenticated;

grant select on table public.ritual_templates to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.enforce_max_two_active_couple_members() from public;
