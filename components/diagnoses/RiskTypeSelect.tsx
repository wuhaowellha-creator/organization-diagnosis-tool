import { riskTypeLabels, riskTypes, type RiskType } from "../../lib/diagnoses/structure";

type RiskTypeSelectProps = {
  disabled?: boolean;
  onChange: (value: RiskType[]) => void;
  value: RiskType[];
};

export function RiskTypeSelect({ disabled = false, onChange, value }: RiskTypeSelectProps) {
  function toggleRiskType(riskType: RiskType) {
    if (disabled) {
      return;
    }

    if (value.includes(riskType)) {
      onChange(value.filter((currentType) => currentType !== riskType));
      return;
    }

    onChange([...value, riskType]);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {riskTypes.map((riskType) => (
        <label
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 has-disabled:bg-slate-100 has-disabled:text-slate-500"
          key={riskType}
        >
          <input
            checked={value.includes(riskType)}
            className="h-4 w-4 rounded border-slate-300"
            disabled={disabled}
            onChange={() => toggleRiskType(riskType)}
            type="checkbox"
            value={riskType}
          />
          <span>{riskTypeLabels[riskType]}</span>
        </label>
      ))}
    </div>
  );
}
