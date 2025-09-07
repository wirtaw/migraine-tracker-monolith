export interface ITrigger {
  id: string;
  userId: string;
  type: string;
  note: string | undefined;
  createdAt: Date;
  datetimeAt: Date;
}
