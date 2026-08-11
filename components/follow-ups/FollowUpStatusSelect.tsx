import { Select } from "../common";
import { followUpStatusLabels, followUpStatuses, type FollowUpStatus } from "../../lib/follow-ups/validation";

type FollowUpStatusSelectProps = {
  disabled?: boolean;
  onChange: (value: FollowUpStatus) => void;
  value: FollowUpStatus;
};

export function FollowUpStatusSelect({ disabled = false, onChange, value }: FollowUpStatusSelectProps) {
  return (
    <Select disabled={disabled} onChange={(event) => onChange(event.target.value as FollowUpStatus)} value={value}>
      {followUpStatuses.map((status) => (
        <option key={status} value={status}>
          {followUpStatusLabels[status]}
        </option>
      ))}
    </Select>
  );
}
