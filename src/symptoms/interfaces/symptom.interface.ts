export interface ISymptom {
  id: string;
  userId: string;
  type: string;
  severity: number;
  note: string;
  createdAt: Date;
  datetimeAt: Date;
}
