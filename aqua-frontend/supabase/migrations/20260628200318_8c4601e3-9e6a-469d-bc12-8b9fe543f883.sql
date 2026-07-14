
-- ============ ROLES ============
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============ BOOTSTRAP FIRST ADMIN ============
create or replace function public.bootstrap_first_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_bootstrap_admin
  after insert on auth.users
  for each row execute function public.bootstrap_first_admin();

-- ============ UPDATED_AT HELPER ============
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- ============ SERVICES ============
create table public.services (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'Droplets',
  title_ar text not null,
  title_en text not null,
  description_ar text not null,
  description_en text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "Anyone can read published services"
  on public.services for select to anon, authenticated
  using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage services"
  on public.services for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- ============ PROJECTS ============
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  location_ar text not null default '',
  location_en text not null default '',
  category text not null default 'residential',
  image_url text not null default '',
  year text not null default '',
  is_featured boolean not null default false,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "Anyone can read published projects"
  on public.projects for select to anon, authenticated
  using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage projects"
  on public.projects for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ============ PRODUCTS ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  caption_ar text not null default '',
  caption_en text not null default '',
  category text not null default 'mosaic',
  image_url text not null default '',
  price_label_ar text not null default '',
  price_label_en text not null default '',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Anyone can read published products"
  on public.products for select to anon, authenticated
  using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage products"
  on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ============ SITE SETTINGS (key/value) ============
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Anyone can read site settings"
  on public.site_settings for select to anon, authenticated using (true);
create policy "Admins manage site settings"
  on public.site_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ============ MESSAGES (contact form) ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  city text not null default '',
  project_type text not null default '',
  budget text not null default '',
  timeline text not null default '',
  subject text not null default '',
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
grant insert on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Anyone can submit a message"
  on public.messages for insert to anon, authenticated
  with check (
    length(name) between 1 and 120
    and length(email) between 3 and 255
    and length(message) between 1 and 4000
  );
create policy "Admins read messages"
  on public.messages for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update messages"
  on public.messages for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete messages"
  on public.messages for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
