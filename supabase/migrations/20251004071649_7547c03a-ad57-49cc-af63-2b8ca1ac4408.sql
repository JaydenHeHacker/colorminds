-- Step 1: Create security definer function for safe role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Step 2: Fix coloring_pages RLS policies - restrict to admin-only
drop policy if exists "Users can insert coloring pages" on public.coloring_pages;
drop policy if exists "Users can update coloring pages" on public.coloring_pages;
drop policy if exists "Users can delete coloring pages" on public.coloring_pages;

create policy "Admins can insert coloring pages"
on public.coloring_pages
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update coloring pages"
on public.coloring_pages
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete coloring pages"
on public.coloring_pages
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Step 3: Fix categories RLS policies - restrict to admin-only
drop policy if exists "Users can update categories" on public.categories;

create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Step 4: Update handle_new_user function to set search_path
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now());
  return new;
end;
$$;