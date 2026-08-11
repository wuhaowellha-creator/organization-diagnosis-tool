import assert from "node:assert/strict";
import test from "node:test";
import { createCsv, parseCsv } from "../lib/csv";
import { parseWorkRecordImport } from "../lib/work-records/import";

test("CSV round-trips commas, quotes, and line breaks", () => {
  const rows = [["name", "content"], ["Alice", "one, two\n\"three\""]];
  assert.deepEqual(parseCsv(createCsv(rows)), rows);
});

test("common HR business categories map to canonical record types", () => {
  const input = createCsv([
    ["记录类型", "涉及对象", "所属团队", "记录内容"],
    ["绩效辅导", "王磊", "研发团队", "需要拆解目标并持续复盘。"],
    ["组织诊断", "客户成功团队", "客户成功部", "需要重新梳理管理分工。"],
    ["管理者反馈", "周经理", "供应链团队", "需要明确授权边界。"]
  ]);
  const result = parseWorkRecordImport(input);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.records.map((record) => record.record_type), [
    "employee_interview",
    "team_observation",
    "manager_feedback"
  ]);
});

test("unknown categories return an actionable row error", () => {
  const input = createCsv([
    ["record_type", "subject_name", "team_name", "content"],
    ["unknown-category", "Sample", "Team", "A factual work observation."]
  ]);
  const result = parseWorkRecordImport(input);

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors[0] ?? "", /unknown-category/);
});
