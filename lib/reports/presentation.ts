import { formatDateTime } from "../work-records/presentation";

export type RecentReportOutput = {
  content: string;
  created_at: string;
  id: string;
  source_end_date: string | null;
  source_start_date: string | null;
  title: string;
};

export function formatReportCreatedAt(value: string) {
  return formatDateTime(value);
}
