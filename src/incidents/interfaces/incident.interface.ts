import { IncidentTypeEnum } from '../enums/incident-type.enum';
import { TriggerTypeEnum } from '../../triggers/enums/trigger-type.enum';

export interface IIncident {
  id: string;
  userId: string;
  type: IncidentTypeEnum;
  startTime: Date;
  durationHours: number;
  notes: string;
  triggers: TriggerTypeEnum[];
  createdAt: Date;
  datetimeAt: Date;
}
