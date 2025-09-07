export interface IWeight {
  id: string;
  userId: string;
  weight: number;
  notes: string | undefined;
  datetimeAt: Date;
}

export interface IHeight {
  id: string;
  userId: string;
  height: number;
  notes: string | undefined;
  datetimeAt: Date;
}

export interface IBloodPressure {
  id: string;
  userId: string;
  systolic: number;
  diastolic: number;
  notes: string | undefined;
  datetimeAt: Date;
}

export interface ISleep {
  id: string;
  userId: string;
  rate: number;
  notes: string | undefined;
  startedAt: Date;
  datetimeAt: Date;
}
