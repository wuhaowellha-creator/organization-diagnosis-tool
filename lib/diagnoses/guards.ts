import type { DiagnosisStatus } from "../work-records/data";

export function canUseDiagnosisForFollowUp(status: DiagnosisStatus) {
  return status === "confirmed";
}

export function canUseDiagnosisForReport(status: DiagnosisStatus) {
  return status === "confirmed";
}
