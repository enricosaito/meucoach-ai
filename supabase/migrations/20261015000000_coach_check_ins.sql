-- Daily coach check-ins: the message the coach writes when the user first opens the app each day.
-- They live in the chat thread (chat_messages) so a reply simply continues the conversation.
-- Existing grants and RLS on chat_messages cover the new columns (read own; writes via the API).

alter table public.chat_messages
  add column kind text not null default 'reply' check (kind in ('reply', 'check_in')),
  -- The user's local calendar day the check-in belongs to (check-ins only).
  add column local_date date,
  -- Suggested one-tap answers shown with the check-in (check-ins only).
  add column quick_replies text[] check (cardinality(quick_replies) <= 4),
  add constraint chat_messages_check_in_has_date check (kind <> 'check_in' or local_date is not null);

-- At most one check-in per user per local day: concurrent opens can't create two.
create unique index chat_messages_one_check_in_per_day
  on public.chat_messages (user_id, local_date)
  where kind = 'check_in';
