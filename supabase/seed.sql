insert into public.ritual_templates (
  id,
  title,
  description,
  category,
  prompt,
  input_type,
  is_active
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Same sky check-in',
    'A gentle daily check-in for feeling close across distance.',
    'connection',
    'Look up at the sky for a moment. What does it feel like where you are?',
    'text',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'One good thing from today',
    'Share one small bright spot from your day.',
    'reflection',
    'What is one good thing that happened today, even if it was tiny?',
    'text',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Tiny gratitude',
    'Name something you appreciate about each other or the day.',
    'gratitude',
    'What is one tiny thing you feel grateful for right now?',
    'text',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Send a photo from where you are',
    'Trade a quiet glimpse of your current world.',
    'photo',
    'Send a photo of something near you that tells the story of this moment.',
    'photo',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'A question for tonight',
    'Leave a warm question to answer when you both have space.',
    'connection',
    'What is one question you would like us to answer together tonight?',
    'text',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'Memory lane',
    'Revisit a shared memory without needing a special occasion.',
    'memory',
    'What is a small memory of us that made you smile recently?',
    'text',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'Tomorrow wish',
    'Send a soft wish for your partner''s tomorrow.',
    'care',
    'What is one thing you hope tomorrow brings for your partner?',
    'text',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'Two-minute grounding',
    'Pause together with a simple grounding prompt.',
    'grounding',
    'Name three things you can see, two sounds you can hear, and one feeling in your body.',
    'text',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    'Parallel coffee/tea moment',
    'Make an ordinary drink feel shared from afar.',
    'parallel_moment',
    'If you are having coffee, tea, or water, share a line or photo from that pause.',
    'text_or_photo',
    true
  ),
  (
    '10000000-0000-4000-8000-00000000000a',
    'Song of the day',
    'Share a song that matches your mood or your day.',
    'reflection',
    'What song fits today for you, and why?',
    'text',
    true
  )
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    prompt = excluded.prompt,
    input_type = excluded.input_type,
    is_active = excluded.is_active;
