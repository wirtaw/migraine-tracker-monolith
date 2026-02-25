export interface IIncident {
  id: string;
  userId: string;
  type: string;
  startTime: Date;
  durationHours: number;
  notes: string | undefined;
  triggers: string[] | undefined;
  createdAt: Date;
  datetimeAt: Date;
}
