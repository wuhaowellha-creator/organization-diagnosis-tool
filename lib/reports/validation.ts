export type ReportSummaryInput = {
  end_date: string;
  start_date: string;
};

export type ReportSummaryInputErrors = Partial<Record<keyof ReportSummaryInput, string>>;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function readDate(payload: Record<string, unknown>, field: keyof ReportSummaryInput) {
  const value = payload[field];

  return typeof value === "string" ? value.trim() : "";
}

function isValidDateString(value: string) {
  if (!datePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getDateRangeBounds(input: ReportSummaryInput) {
  const start = new Date(`${input.start_date}T00:00:00.000Z`);
  const endExclusive = new Date(`${input.end_date}T00:00:00.000Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return {
    endExclusive: endExclusive.toISOString(),
    start: start.toISOString()
  };
}

export function validateReportSummaryInput(payload: Record<string, unknown>) {
  const errors: ReportSummaryInputErrors = {};
  const startDate = readDate(payload, "start_date");
  const endDate = readDate(payload, "end_date");

  if (!startDate) {
    errors.start_date = "请选择开始日期。";
  } else if (!isValidDateString(startDate)) {
    errors.start_date = "开始日期格式不正确。";
  }

  if (!endDate) {
    errors.end_date = "请选择结束日期。";
  } else if (!isValidDateString(endDate)) {
    errors.end_date = "结束日期格式不正确。";
  }

  if (isValidDateString(startDate) && isValidDateString(endDate) && startDate > endDate) {
    errors.end_date = "结束日期不能早于开始日期。";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      ok: false as const
    };
  }

  return {
    data: {
      end_date: endDate,
      start_date: startDate
    },
    ok: true as const
  };
}
