export const followUpStatuses = ["not_started", "in_progress", "resolved", "under_observation"] as const;

export type FollowUpStatus = (typeof followUpStatuses)[number];

export type FollowUpInput = {
  problem_description: string;
  review_result: string;
  status: FollowUpStatus;
  suggested_actions: string;
  title: string;
};

export type FollowUpCreateInput = {
  title: string;
};

export type FollowUpInputErrors = Partial<Record<keyof FollowUpInput, string>>;
export type FollowUpCreateInputErrors = Partial<Record<keyof FollowUpCreateInput, string>>;

export const followUpStatusLabels: Record<FollowUpStatus, string> = {
  in_progress: "跟进中",
  not_started: "未开始",
  resolved: "已解决",
  under_observation: "持续观察"
};

export function isFollowUpStatus(value: unknown): value is FollowUpStatus {
  return typeof value === "string" && followUpStatuses.includes(value as FollowUpStatus);
}

function readTrimmedString(payload: Record<string, unknown>, field: string) {
  const value = payload[field];

  return typeof value === "string" ? value.trim() : "";
}

export function validateFollowUpCreateInput(payload: Record<string, unknown>) {
  const title = readTrimmedString(payload, "title");
  const errors: FollowUpCreateInputErrors = {};

  if (!title) {
    errors.title = "请填写问题名称。";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      ok: false as const
    };
  }

  return {
    data: {
      title
    },
    ok: true as const
  };
}

export function validateFollowUpInput(payload: Record<string, unknown>) {
  const errors: FollowUpInputErrors = {};
  const status = payload.status;
  const title = readTrimmedString(payload, "title");

  if (!title) {
    errors.title = "请填写问题名称。";
  }

  if (!isFollowUpStatus(status)) {
    errors.status = "跟进状态只能选择固定四类。";
  }

  if (Object.keys(errors).length > 0 || !isFollowUpStatus(status)) {
    return {
      errors,
      ok: false as const
    };
  }

  return {
    data: {
      problem_description: readTrimmedString(payload, "problem_description"),
      review_result: readTrimmedString(payload, "review_result"),
      status,
      suggested_actions: readTrimmedString(payload, "suggested_actions"),
      title
    },
    ok: true as const
  };
}
