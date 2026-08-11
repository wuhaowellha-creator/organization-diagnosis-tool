import { Select } from "../common";
import { recordTypeLabels, recordTypes } from "../../lib/work-records/validation";

type RecordTypeSelectProps = {
  disabled?: boolean;
  errorId?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
};

export function RecordTypeSelect({
  disabled = false,
  errorId,
  name = "record_type",
  onChange,
  value
}: RecordTypeSelectProps) {
  return (
    <Select
      aria-describedby={errorId}
      aria-invalid={Boolean(errorId)}
      disabled={disabled}
      name={name}
      onChange={(event) => onChange(event.target.value)}
      required
      value={value}
    >
      <option value="">请选择记录类型</option>
      {recordTypes.map((recordType) => (
        <option key={recordType} value={recordType}>
          {recordTypeLabels[recordType]}
        </option>
      ))}
    </Select>
  );
}
