-- Photos and voice notes in the coach chat. Neither is stored: a photo is sent to the AI for that
-- one reply and kept only on the user's phone; a voice note is transcribed and discarded. The
-- message keeps a flag so the thread (and the coach, later on) knows what kind of message it was.

alter table public.chat_messages
  add column has_image boolean not null default false,
  -- The content is a transcript of a voice note.
  add column via_voice boolean not null default false,
  -- A photo-only message has no text.
  drop constraint chat_messages_content_check,
  add constraint chat_messages_content_check
    check (char_length(content) <= 8000 and (char_length(content) >= 1 or has_image));
