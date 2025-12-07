-- Enable moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Create ad_submissions table
create table if not exists ad_submissions (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  company text,
  business_type text not null,
  ad_type text not null,
  ad_title text not null,
  ad_description text not null,
  target_audience text not null,
  budget text not null,
  duration text not null,
  custom_duration text,
  start_date date not null,
  website text,
  additional_info text,
  terms_accepted boolean not null default false,
  attachment_urls text[] default array[]::text[],
  status text not null default 'pending',
  payment_status text not null default 'pending',
  payment_reference text,
  payment_amount numeric,
  payment_date timestamptz,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table ad_submissions enable row level security;

-- Create policies
-- Allow anyone to submit an ad (public access for insert)
drop policy if exists "Anyone can submit ads" on ad_submissions;
create policy "Anyone can submit ads"
  on ad_submissions for insert
  with check (true);

-- Allow admins to view all ads
drop policy if exists "Admins can view all ads" on ad_submissions;
create policy "Admins can view all ads"
  on ad_submissions for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Allow admins to update ads
drop policy if exists "Admins can update ads" on ad_submissions;
create policy "Admins can update ads"
  on ad_submissions for update
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Create updated_at trigger
drop trigger if exists handle_updated_at on ad_submissions;
create trigger handle_updated_at before update on ad_submissions
  for each row execute procedure moddatetime (updated_at);

-- Grant access to roles
grant insert, select, update on table ad_submissions to anon, authenticated, service_role;
