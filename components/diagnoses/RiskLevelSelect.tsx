import { Select } from "../common";
import { editableRiskLevelLabels } from "../../lib/diagnoses/structure";
import type { RiskLevel } from "../../lib/work-records/data";

const riskLevels = ["low", "medium", "high"] as const;

type RiskLevelSelectProps = {
  disabled?: boolean;
  onChange: (value: RiskLevel) => void;
  value: RiskLevel;
};

export function RiskLevelSelect({ disabled = false, onChange, value }: RiskLevelSelectProps) {
  return (
    <Select disabled={disabled} onChange={(event) => onChange(event.target.value as RiskLevel)} value={value}>
      {riskLevels.map((riskLevel) => (
        <option key={riskLevel} value={riskLevel}>
          {editableRiskLevelLabels[riskLevel]}
        </option>
      ))}
    </Select>
  );
}
