alter table public.work_records enable row level security;
alter table public.ai_diagnoses enable row level security;
alter table public.follow_up_items enable row level security;
alter table public.report_outputs enable row level security;

alter table public.work_records force row level security;
alter table public.ai_diagnoses force row level security;
alter table public.follow_up_items force row level security;
alter table public.report_outputs force row level security;

drop policy if exists "Users can select own work records" on public.work_records;
create policy "Users can select own work records"
  on public.work_records
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own work records" on public.work_records;
create policy "Users can insert own work records"
  on public.work_records
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own work records" on public.work_records;
create policy "Users can update own work records"
  on public.work_records
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can select own ai diagnoses" on public.ai_diagnoses;
create policy "Users can select own ai diagnoses"
  on public.ai_diagnoses
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai diagnoses" on public.ai_diagnoses;
create policy "Users can insert own ai diagnoses"
  on public.ai_diagnoses
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai diagnoses" on public.ai_diagnoses;
create policy "Users can update own ai diagnoses"
  on public.ai_diagnoses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can select own follow up items" on public.follow_up_items;
create policy "Users can select own follow up items"
  on public.follow_up_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own follow up items" on public.follow_up_items;
create policy "Users can insert own follow up items"
  on public.follow_up_items
  for insert
  with check (
    auth.uid() = user_id
    and work_record_id is not null
    and ai_diagnosis_id is not null
    and exists (
      select 1
      from public.ai_diagnoses
      where ai_diagnoses.id = follow_up_items.ai_diagnosis_id
        and ai_diagnoses.work_record_id = follow_up_items.work_record_id
        and ai_diagnoses.user_id = auth.uid()
        and ai_diagnoses.confirmed_by_user = true
        and ai_diagnoses.risk_level in ('medium', 'high')
    )
  );

drop policy if exists "Users can update own follow up items" on public.follow_up_items;
create policy "Users can update own follow up items"
  on public.follow_up_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can select own report outputs" on public.report_outputs;
create policy "Users can select own report outputs"
  on public.report_outputs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own report outputs" on public.report_outputs;
create policy "Users can insert own report outputs"
  on public.report_outputs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own report outputs" on public.report_outputs;
create policy "Users can update own report outputs"
  on public.report_outputs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- MVP v0.1 intentionally defines no delete policies.
