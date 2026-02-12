import type { IncidentStatus } from "../app/models/orderIncident";

const labels: Record<IncidentStatus, string> = {
  None: "Sem incidentes",
  Open: "Incidente aberto",
  Resolved: "Incidente resolvido",
};

export function getIncidentStatusLabel(status: IncidentStatus | null | undefined) {
  if (!status) return labels.None;
  return labels[status] ?? status;
}
