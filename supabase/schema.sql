create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.work_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  record_type text not null check (record_type in ('employee_interview', 'manager_feedback', 'team_observation')),
  subject_name text not null,
  team_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_records_id_user_id_key unique (id, user_id)
);

create table if not exists public.ai_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  work_record_id uuid not null,
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high')),
  summary text not null default '',
  reasoning text not null default '',
  suggested_actions text not null default '',
  structured_result jsonb not null default '{}'::jsonb,
  confirmed_by_user boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_diagnoses_id_user_id_key unique (id, user_id),
  constraint ai_diagnoses_work_record_user_fk
    foreign key (work_record_id, user_id)
    references public.work_records(id, user_id)
);

create table if not exists public.follow_up_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  work_record_id uuid not null,
  ai_diagnosis_id uuid not null,
  subject_name text not null default '',
  team_name text not null default '',
  risk_types jsonb not null default '[]'::jsonb,
  risk_level text not null,
  title text not null,
  problem_description text not null default '',
  suggested_actions text not null default '',
  review_result text not null default '',
  status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_up_items_risk_level_check
    check (risk_level in ('medium', 'high')),
  constraint follow_up_items_status_check
    check (status in ('not_started', 'in_progress', 'resolved', 'under_observation')),
  constraint follow_up_items_work_record_user_fk
    foreign key (work_record_id, user_id)
    references public.work_records(id, user_id),
  constraint follow_up_items_ai_diagnosis_user_fk
    foreign key (ai_diagnosis_id, user_id)
    references public.ai_diagnoses(id, user_id),
  constraint follow_up_items_source_check
    check (work_record_id is not null or ai_diagnosis_id is not null)
);

create table if not exists public.report_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  report_type text not null default 'diagnosis_summary' check (report_type in ('diagnosis_summary', 'weekly_report')),
  content text not null,
  source_start_date date,
  source_end_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_records_user_id_created_at_idx
  on public.work_records(user_id, created_at desc);

create index if not exists ai_diagnoses_user_id_work_record_id_idx
  on public.ai_diagnoses(user_id, work_record_id);

create index if not exists follow_up_items_user_id_status_idx
  on public.follow_up_items(user_id, status);

create index if not exists report_outputs_user_id_created_at_idx
  on public.report_outputs(user_id, created_at desc);

alter table public.ai_diagnoses
  add column if not exists confirmed_by_user boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_diagnoses'
      and column_name = 'is_confirmed'
  ) then
    execute 'update public.ai_diagnoses set confirmed_by_user = is_confirmed where is_confirmed = true';
  end if;
end $$;

alter table public.follow_up_items
  add column if not exists subject_name text not null default '',
  add column if not exists team_name text not null default '',
  add column if not exists risk_types jsonb not null default '[]'::jsonb,
  add column if not exists problem_description text not null default '',
  add column if not exists suggested_actions text not null default '',
  add column if not exists review_result text not null default '';

alter table public.follow_up_items
  alter column status set default 'not_started';

alter table public.follow_up_items
  drop constraint if exists follow_up_items_status_check;

alter table public.follow_up_items
  drop constraint if exists follow_up_items_risk_level_check;

update public.follow_up_items
set status = case status
  when 'open' then 'not_started'
  when 'completed' then 'resolved'
  else status
end
where status in ('open', 'completed');

update public.follow_up_items
set risk_level = 'medium'
where risk_level not in ('medium', 'high');

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'follow_up_items'
      and column_name = 'description'
  ) then
    execute 'update public.follow_up_items set problem_description = description where problem_description = ''''';
  end if;
end $$;

alter table public.follow_up_items
  add constraint follow_up_items_status_check
    check (status in ('not_started', 'in_progress', 'resolved', 'under_observation'));

alter table public.follow_up_items
  add constraint follow_up_items_risk_level_check
    check (risk_level in ('medium', 'high'));

drop trigger if exists set_work_records_updated_at on public.work_records;
create trigger set_work_records_updated_at
  before update on public.work_records
  for each row execute function public.set_updated_at();

drop trigger if exists set_ai_diagnoses_updated_at on public.ai_diagnoses;
create trigger set_ai_diagnoses_updated_at
  before update on public.ai_diagnoses
  for each row execute function public.set_updated_at();

drop trigger if exists set_follow_up_items_updated_at on public.follow_up_items;
create trigger set_follow_up_items_updated_at
  before update on public.follow_up_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_report_outputs_updated_at on public.report_outputs;
create trigger set_report_outputs_updated_at
  before update on public.report_outputs
  for each row execute function public.set_updated_at();
