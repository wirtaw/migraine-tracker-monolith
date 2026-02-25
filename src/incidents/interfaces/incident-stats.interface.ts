export interface IIncidentStats {
  byType: Record<string, number>;
  byTrigger: Record<string, number>;
  byTime: {
    // Aggregations useful for heatmap and calendar
    dailyCounts: Record<string, number>; // Format: "YYYY-MM-DD" -> count
    totalDurationHours: number;
    averageDurationHours: number;
    totalIncidents: number;
  };
}
