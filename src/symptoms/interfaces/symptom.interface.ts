export interface ISymptom {
  id: string;
  userId: string;
  type: string;
  severity: number;
  note: string | undefined;
  createdAt: Date;
  datetimeAt: Date;
}
