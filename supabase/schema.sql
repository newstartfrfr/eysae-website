-- EYSAE community database and Row Level Security setup
-- Run in Supabase SQL Editor for the project used by assets/js/supabase-config.js.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Member',
  role_label text not null default 'Member',
  bio text,
  social_link text,
  avatar_url text,
  avatar_path text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists avatar_path text;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default 'Member',
  author_role text not null default 'Member',
  author_avatar_url text,
  type text not null default 'update',
  tag text,
  title text,
  content text not null,
  image_url text,
  image_path text,
  status text not null default 'pending',
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists author_avatar_url text;

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft', 'pending', 'approved', 'rejected'));
alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts add constraint posts_type_check check (type in ('blog', 'photo', 'update', 'notice', 'discussion'));

create table if not exists public.conversations (
  id text primary key,
  member_a uuid not null references public.profiles(id) on delete cascade,
  member_b uuid not null references public.profiles(id) on delete cascade,
  last_message_text text,
  last_sender_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_members check (member_a <> member_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_distinct_members check (sender_id <> recipient_id),
  constraint messages_body_length check (char_length(body) between 1 and 2000)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default 'Member',
  author_role text not null default 'Member',
  author_avatar_url text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_comments_body_length check (char_length(body) between 1 and 2000)
);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_unique unique (post_id, user_id)
);

create index if not exists posts_public_feed_idx on public.posts (status, published_at desc);
create index if not exists posts_author_idx on public.posts (author_id, updated_at desc);
create index if not exists conversations_member_a_idx on public.conversations (member_a, updated_at desc);
create index if not exists conversations_member_b_idx on public.conversations (member_b, updated_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at asc);
create index if not exists messages_recipient_unread_idx on public.messages (recipient_id, read_at);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at asc);
create index if not exists post_likes_post_idx on public.post_likes (post_id, created_at desc);

create or replace function public.is_eysae_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_eysae_admin() from public;
grant execute on function public.is_eysae_admin() to authenticated;

create or replace function public.enforce_post_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_role text;
  profile_avatar text;
begin
  if tg_op = 'UPDATE' and not public.is_eysae_admin() then
    new.author_id := old.author_id;
  elsif tg_op = 'INSERT' and not public.is_eysae_admin() then
    new.author_id := auth.uid();
  end if;

  select display_name, role_label, avatar_url into profile_name, profile_role, profile_avatar
  from public.profiles where id = new.author_id;
  new.author_name := coalesce(profile_name, 'Member');
  new.author_role := coalesce(profile_role, 'Member');
  new.author_avatar_url := profile_avatar;

  if not public.is_eysae_admin() then
    if new.status not in ('draft', 'pending') then
      raise exception 'Members may only save drafts or submit posts for review';
    end if;
    new.reviewer_id := null;
    new.reviewed_at := null;
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_post_workflow_trigger on public.posts;
create trigger enforce_post_workflow_trigger
before insert or update on public.posts
for each row execute function public.enforce_post_workflow();

create or replace function public.enforce_comment_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_id := auth.uid();
  select display_name, role_label, avatar_url
    into new.author_name, new.author_role, new.author_avatar_url
  from public.profiles where id = auth.uid();
  new.author_name := coalesce(new.author_name, 'Member');
  new.author_role := coalesce(new.author_role, 'Member');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists enforce_comment_identity_trigger on public.post_comments;
create trigger enforce_comment_identity_trigger
before insert or update on public.post_comments
for each row execute function public.enforce_comment_identity();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_likes enable row level security;

drop policy if exists "profiles visible to members" on public.profiles;
create policy "profiles visible to members" on public.profiles for select to authenticated using (true);
drop policy if exists "members create own profile" on public.profiles;
create policy "members create own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "members update own profile" on public.profiles;
create policy "members update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "public reads approved posts" on public.posts;
create policy "public reads approved posts" on public.posts for select to anon using (status = 'approved');
drop policy if exists "members read approved and own posts" on public.posts;
create policy "members read approved and own posts" on public.posts for select to authenticated using (status = 'approved' or author_id = auth.uid() or public.is_eysae_admin());
drop policy if exists "members create own submissions" on public.posts;
create policy "members create own submissions" on public.posts for insert to authenticated with check (
  (author_id = auth.uid() and status in ('draft', 'pending')) or public.is_eysae_admin()
);
drop policy if exists "members edit own submissions" on public.posts;
create policy "members edit own submissions" on public.posts for update to authenticated using (
  author_id = auth.uid() or public.is_eysae_admin()
) with check (
  (author_id = auth.uid() and status in ('draft', 'pending')) or public.is_eysae_admin()
);
drop policy if exists "members delete own posts" on public.posts;
create policy "members delete own posts" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_eysae_admin());

drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations for select to authenticated using (auth.uid() in (member_a, member_b));
drop policy if exists "participants create conversations" on public.conversations;
create policy "participants create conversations" on public.conversations for insert to authenticated with check (auth.uid() in (member_a, member_b));
drop policy if exists "participants update conversations" on public.conversations;
create policy "participants update conversations" on public.conversations for update to authenticated using (auth.uid() in (member_a, member_b)) with check (auth.uid() in (member_a, member_b));

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages for select to authenticated using (auth.uid() in (sender_id, recipient_id));
drop policy if exists "members send own messages" on public.messages;
create policy "members send own messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and auth.uid() in (c.member_a, c.member_b)
      and recipient_id in (c.member_a, c.member_b)
  )
);
drop policy if exists "recipients mark messages read" on public.messages;
create policy "recipients mark messages read" on public.messages for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists "public reads comments on published posts" on public.post_comments;
create policy "public reads comments on published posts" on public.post_comments for select to public using (
  exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);
drop policy if exists "members comment on published posts" on public.post_comments;
create policy "members comment on published posts" on public.post_comments for insert to authenticated with check (
  author_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);
drop policy if exists "members delete own comments" on public.post_comments;
create policy "members delete own comments" on public.post_comments for delete to authenticated using (
  author_id = auth.uid() or public.is_eysae_admin()
);

drop policy if exists "public reads post likes" on public.post_likes;
create policy "public reads post likes" on public.post_likes for select to public using (
  exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);
drop policy if exists "members like published posts" on public.post_likes;
create policy "members like published posts" on public.post_likes for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);
drop policy if exists "members remove own likes" on public.post_likes;
create policy "members remove own likes" on public.post_likes for delete to authenticated using (user_id = auth.uid());

-- Keep profile email private at the SQL permission layer.
revoke all on public.profiles from anon;
revoke select on public.profiles from authenticated;
revoke insert, update on public.profiles from authenticated;
grant select (id, display_name, role_label, bio, social_link, avatar_url, avatar_path, is_admin, created_at, updated_at) on public.profiles to authenticated;
grant insert (id, email, display_name, role_label, bio, social_link, avatar_url, avatar_path, created_at, updated_at) on public.profiles to authenticated;
grant update (display_name, role_label, bio, social_link, avatar_url, avatar_path, updated_at) on public.profiles to authenticated;

grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
revoke all on public.conversations from authenticated;
grant select, insert on public.conversations to authenticated;
grant update (last_message_text, last_sender_id, updated_at) on public.conversations to authenticated;
revoke all on public.messages from authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant select on public.post_comments to anon;
grant select, insert, delete on public.post_comments to authenticated;
grant select on public.post_likes to anon;
grant select, insert, delete on public.post_likes to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public reads post images" on storage.objects;
create policy "public reads post images" on storage.objects for select to public using (bucket_id = 'post-images');
drop policy if exists "members upload own post images" on storage.objects;
create policy "members upload own post images" on storage.objects for insert to authenticated with check (
  bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "members update own post images" on storage.objects;
create policy "members update own post images" on storage.objects for update to authenticated using (
  bucket_id = 'post-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_eysae_admin())
) with check (
  bucket_id = 'post-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_eysae_admin())
);
drop policy if exists "members delete own post images" on storage.objects;
create policy "members delete own post images" on storage.objects for delete to authenticated using (
  bucket_id = 'post-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_eysae_admin())
);

-- Promote the project editor after that person has created an account.
-- Replace the email if needed, then run this statement separately:
-- update public.profiles set is_admin = true where email = 'dan.grmusa@gmail.com';
