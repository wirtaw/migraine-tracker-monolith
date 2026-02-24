import { TriggerTypeEnum } from '../../triggers/enums/trigger-type.enum';

export interface IIncidentStats {
  byType: Record<string, number>;
  byTrigger: Record<TriggerTypeEnum, number>;
  byTime: {
    // Aggregations useful for heatmap and calendar
    dailyCounts: Record<string, number>; // Format: "YYYY-MM-DD" -> count
    totalDurationHours: number;
    averageDurationHours: number;
    totalIncidents: number;
  };
}
