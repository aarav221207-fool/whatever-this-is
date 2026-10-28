-- Real, authenticated student/JD storage for the JSS placement portal.
create extension if not exists pgcrypto;

create table if not exists public.placement_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_placement_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.placement_staff ps where ps.user_id = auth.uid()
  );
$$;

revoke all on function public.is_placement_staff() from public;
grant execute on function public.is_placement_staff() to authenticated;

create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  summary text not null default '',
  source_file text,
  resume_storage_path text,
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_skills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  skill_name text not null,
  category_code text not null default 'OTHER',
  confidence text not null default 'medium' check (confidence in ('high','medium','low')),
  evidence text not null default '',
  level integer check (level between 1 and 10),
  created_at timestamptz not null default now(),
  unique (student_id, skill_name)
);

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id integer references public.companies(company_id) on delete set null,
  company_name text not null default '',
  role_title text not null default '',
  source_file text,
  description text not null,
  description_summary text not null default '',
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  experience_years_required integer,
  location text,
  extracted_data jsonb not null default '{}'::jsonb,
  content_hash text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active','closed','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, content_hash)
);

create table if not exists public.job_matches (
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  job_id uuid not null references public.job_postings(id) on delete cascade,
  match_score numeric(5,2) not null default 0 check (match_score >= 0 and match_score <= 100),
  matched_skills jsonb not null default '[]'::jsonb,
  missing_required_skills jsonb not null default '[]'::jsonb,
  missing_preferred_skills jsonb not null default '[]'::jsonb,
  action_plan jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (student_id, job_id)
);

create index if not exists student_skills_student_idx on public.student_skills(student_id);
create index if not exists job_postings_status_created_idx on public.job_postings(status, created_at desc);
create index if not exists job_postings_company_idx on public.job_postings(company_id);
create index if not exists job_matches_job_score_idx on public.job_matches(job_id, match_score desc);

alter table public.placement_staff enable row level security;
alter table public.student_profiles enable row level security;
alter table public.student_skills enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_matches enable row level security;

drop policy if exists "Staff list own placement role" on public.placement_staff;
create policy "Staff list own placement role" on public.placement_staff
for select to authenticated using (user_id = auth.uid());

drop policy if exists "Students read own profile and placement staff read all" on public.student_profiles;
create policy "Students read own profile and placement staff read all" on public.student_profiles
for select to authenticated using (id = auth.uid() or public.is_placement_staff());

drop policy if exists "Students create own profile" on public.student_profiles;
create policy "Students create own profile" on public.student_profiles
for insert to authenticated with check (id = auth.uid());

drop policy if exists "Students update own profile" on public.student_profiles;
create policy "Students update own profile" on public.student_profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Students read own skills and staff read all" on public.student_skills;
create policy "Students read own skills and staff read all" on public.student_skills
for select to authenticated using (student_id = auth.uid() or public.is_placement_staff());

drop policy if exists "Students replace own skills" on public.student_skills;
create policy "Students replace own skills" on public.student_skills
for insert to authenticated with check (student_id = auth.uid());

drop policy if exists "Students edit own skills" on public.student_skills;
create policy "Students edit own skills" on public.student_skills
for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "Students remove own skills" on public.student_skills;
create policy "Students remove own skills" on public.student_skills
for delete to authenticated using (student_id = auth.uid());

drop policy if exists "Authenticated users read active jobs" on public.job_postings;
create policy "Authenticated users read active jobs" on public.job_postings
for select to authenticated using (status = 'active' or created_by = auth.uid() or public.is_placement_staff());

drop policy if exists "Only placement staff create jobs" on public.job_postings;
create policy "Only placement staff create jobs" on public.job_postings
for insert to authenticated with check (public.is_placement_staff() and created_by = auth.uid());

drop policy if exists "Only placement staff update jobs" on public.job_postings;
create policy "Only placement staff update jobs" on public.job_postings
for update to authenticated using (public.is_placement_staff()) with check (public.is_placement_staff());

drop policy if exists "Only placement staff delete jobs" on public.job_postings;
create policy "Only placement staff delete jobs" on public.job_postings
for delete to authenticated using (public.is_placement_staff());

drop policy if exists "Students read own matches and staff read all" on public.job_matches;
create policy "Students read own matches and staff read all" on public.job_matches
for select to authenticated using (student_id = auth.uid() or public.is_placement_staff());

drop policy if exists "Students save own matches" on public.job_matches;
create policy "Students save own matches" on public.job_matches
for insert to authenticated with check (student_id = auth.uid() or public.is_placement_staff());

drop policy if exists "Students update own matches and staff update all" on public.job_matches;
create policy "Students update own matches and staff update all" on public.job_matches
for update to authenticated using (student_id = auth.uid() or public.is_placement_staff())
with check (student_id = auth.uid() or public.is_placement_staff());

grant select, insert, update, delete on public.placement_staff, public.student_profiles, public.student_skills, public.job_postings, public.job_matches to authenticated;

-- Private resume storage: a student can access only their own UUID-prefixed files;
-- authorized placement staff can review resumes through authenticated access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-resumes', 'student-resumes', false, 4194304, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict (id) do update set public = false, file_size_limit = 4194304,
  allowed_mime_types = array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];

drop policy if exists "Students upload own resume" on storage.objects;
create policy "Students upload own resume" on storage.objects
for insert to authenticated with check (
  bucket_id = 'student-resumes' and name like (auth.uid()::text || '/%')
);

drop policy if exists "Students read own resume and staff read resumes" on storage.objects;
create policy "Students read own resume and staff read resumes" on storage.objects
for select to authenticated using (
  bucket_id = 'student-resumes' and
  (name like (auth.uid()::text || '/%') or public.is_placement_staff())
);

drop policy if exists "Students update own resume" on storage.objects;
create policy "Students update own resume" on storage.objects
for update to authenticated using (
  bucket_id = 'student-resumes' and name like (auth.uid()::text || '/%')
) with check (
  bucket_id = 'student-resumes' and name like (auth.uid()::text || '/%')
);

drop policy if exists "Students delete own resume" on storage.objects;
create policy "Students delete own resume" on storage.objects
for delete to authenticated using (
  bucket_id = 'student-resumes' and name like (auth.uid()::text || '/%')
);
