
ALTER TABLE public.room_passwords ADD COLUMN IF NOT EXISTS owner_token_hash text;
ALTER TABLE public.room_passwords ALTER COLUMN created_by DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_room_passwords_room_code ON public.room_passwords (room_code);
