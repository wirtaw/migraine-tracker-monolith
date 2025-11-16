import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema()
class Forecast {
  @Prop()
  description?: string;

  @Prop()
  temperature?: number;

  @Prop()
  pressure?: number;

  @Prop()
  humidity?: number;

  @Prop()
  windSpeed?: number;

  @Prop()
  clouds?: number;

  @Prop()
  uvi?: number;

  @Prop()
  datetime!: string;
}

@Schema()
class Solar {
  @Prop()
  kIndex?: number;

  @Prop()
  aIndex?: number;

  @Prop()
  flareProbability?: number;

  @Prop()
  datetime!: string;
}

@Schema()
class SolarRadiation {
  @Prop()
  uviIndex?: number;

  @Prop()
  ozone?: number;

  @Prop()
  solarFlux?: number;

  @Prop()
  sunsPotNumber?: number;

  @Prop()
  date!: string;
}

const ForecastSchema = SchemaFactory.createForClass(Forecast);
const SolarSchema = SchemaFactory.createForClass(Solar);
const SolarRadiationSchema = SchemaFactory.createForClass(SolarRadiation);

@Schema()
export class Location {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  latitude!: string;

  @Prop({ required: true })
  longitude!: string;

  @Prop({ type: [ForecastSchema] })
  forecast?: Forecast[];

  @Prop({ type: [SolarSchema] })
  solar?: Solar[];

  @Prop({ type: [SolarRadiationSchema] })
  solarRadiation?: SolarRadiation[];

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ required: true })
  datetimeAt!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Incident', default: null })
  incidentId?: string;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
