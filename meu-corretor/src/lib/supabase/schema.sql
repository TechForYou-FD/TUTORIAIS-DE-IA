-- O Meu Corretor — Supabase Schema

create extension if not exists "uuid-ossp";

-- Teachers (managed by Supabase Auth)
create table if not exists public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  school text,
  created_at timestamptz default now()
);

-- Classes / Turmas
create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null,
  year text not null,
  drive_folder_id text,
  drive_folder_url text,
  created_at timestamptz default now()
);

-- Assignments / Tarefas
create table if not exists public.assignments (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  description text,
  proposal_text text not null,
  language text not null default 'pt' check (language in ('pt','en')),
  criteria jsonb not null default '[]',
  available_from timestamptz not null,
  available_to timestamptz,
  token text unique not null default encode(gen_random_bytes(24), 'base64url'),
  status text not null default 'draft' check (status in ('draft','active','closed')),
  created_at timestamptz default now()
);

-- Student Submissions
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  student_class text not null,
  text_content text not null default '',
  submitted_at timestamptz,
  status text not null default 'draft' check (status in ('draft','submitted','corrected')),
  fraud_events jsonb not null default '[]',
  auto_saved_at timestamptz,
  created_at timestamptz default now()
);

-- AI Corrections
create table if not exists public.corrections (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  proposed_grade numeric(5,2) not null,
  approved_grade numeric(5,2),
  max_grade numeric(5,2) not null default 20,
  criteria_scores jsonb not null default '[]',
  errors jsonb not null default '[]',
  summary text not null,
  student_report text not null,
  teacher_notes text,
  corrected_at timestamptz default now(),
  email_sent boolean not null default false,
  email_sent_at timestamptz
);

-- RLS Policies
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.corrections enable row level security;

-- Teachers can only see their own data
create policy "teachers_own" on public.teachers for all using (auth.uid() = id);
create policy "classes_own" on public.classes for all using (auth.uid() = teacher_id);
create policy "assignments_own" on public.assignments for all using (auth.uid() = teacher_id);
create policy "submissions_own" on public.submissions for all
  using (assignment_id in (select id from public.assignments where teacher_id = auth.uid()));
create policy "corrections_own" on public.corrections for all
  using (submission_id in (
    select s.id from public.submissions s
    join public.assignments a on a.id = s.assignment_id
    where a.teacher_id = auth.uid()
  ));

-- Public: students can insert submissions for active assignments
create policy "submissions_student_insert" on public.submissions for insert
  with check (
    assignment_id in (
      select id from public.assignments
      where status = 'active'
        and available_from <= now()
        and (available_to is null or available_to >= now())
    )
  );

-- Public: students can update their own draft submission (by id + email match)
create policy "submissions_student_update" on public.submissions for update
  using (status = 'draft')
  with check (status = 'draft');

-- Function to get assignment by token (public)
create or replace function public.get_assignment_by_token(p_token text)
returns table (
  id uuid, title text, description text, proposal_text text,
  language text, criteria jsonb, available_from timestamptz,
  available_to timestamptz, status text, class_name text
) security definer as $$
  select a.id, a.title, a.description, a.proposal_text,
         a.language, a.criteria, a.available_from, a.available_to,
         a.status, c.name as class_name
  from public.assignments a
  join public.classes c on c.id = a.class_id
  where a.token = p_token;
$$ language sql;
