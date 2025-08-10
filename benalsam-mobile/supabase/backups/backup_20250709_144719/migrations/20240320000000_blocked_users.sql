-- Create blocked_users table
create table if not exists public.blocked_users (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure a user can't block themselves
  constraint blocked_users_no_self_block check (user_id != blocked_user_id),
  
  -- Ensure unique combinations of user_id and blocked_user_id
  constraint blocked_users_unique_combination unique (user_id, blocked_user_id)
);

-- Add RLS policies
alter table public.blocked_users enable row level security;

create policy "Users can view their own blocked users"
  on public.blocked_users for select
  using (auth.uid() = user_id);

create policy "Users can block other users"
  on public.blocked_users for insert
  with check (auth.uid() = user_id);

create policy "Users can unblock users they've blocked"
  on public.blocked_users for delete
  using (auth.uid() = user_id);

-- Create function to check if a user is blocked
create or replace function public.is_user_blocked(blocker_id uuid, blocked_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.blocked_users
    where user_id = blocker_id
    and blocked_user_id = blocked_id
  );
end;
$$;

-- Create function to block a user
create or replace function public.block_user(blocked_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Check if the user exists
  if not exists (select 1 from auth.users where id = blocked_user_id) then
    return json_build_object(
      'success', false,
      'message', 'User not found'
    );
  end if;
  
  -- Check if trying to block self
  if v_user_id = blocked_user_id then
    return json_build_object(
      'success', false,
      'message', 'Cannot block yourself'
    );
  end if;
  
  -- Check if already blocked
  if exists (
    select 1
    from public.blocked_users
    where user_id = v_user_id
    and blocked_user_id = blocked_user_id
  ) then
    return json_build_object(
      'success', false,
      'message', 'User is already blocked'
    );
  end if;
  
  -- Insert the block
  insert into public.blocked_users (user_id, blocked_user_id)
  values (v_user_id, blocked_user_id);
  
  return json_build_object(
    'success', true,
    'message', 'User blocked successfully'
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', 'Error blocking user: ' || SQLERRM
    );
end;
$$;

-- Create function to unblock a user
create or replace function public.unblock_user(blocked_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Check if the block exists
  if not exists (
    select 1
    from public.blocked_users
    where user_id = v_user_id
    and blocked_user_id = blocked_user_id
  ) then
    return json_build_object(
      'success', false,
      'message', 'User is not blocked'
    );
  end if;
  
  -- Remove the block
  delete from public.blocked_users
  where user_id = v_user_id
  and blocked_user_id = blocked_user_id;
  
  return json_build_object(
    'success', true,
    'message', 'User unblocked successfully'
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', 'Error unblocking user: ' || SQLERRM
    );
end;
$$;

-- Add updated_at trigger
create trigger set_blocked_users_updated_at
  before update on public.blocked_users
  for each row
  execute function public.set_updated_at(); 