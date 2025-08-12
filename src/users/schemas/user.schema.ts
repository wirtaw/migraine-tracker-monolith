import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
class FetchDataErrors {
  @Prop({ required: true })
  forecast: string;

  @Prop({ required: true })
  magneticWeather: string;
}

const FetchDataErrorsSchema = SchemaFactory.createForClass(FetchDataErrors);

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  longitude: string;

  @Prop({ required: true })
  latitude: string;

  @Prop({ required: true })
  birthDate: string;

  @Prop({ required: true })
  emailNotifications: boolean;

  @Prop({ required: true })
  dailySummary: boolean;

  @Prop({ required: true })
  personalHealthData: boolean;

  @Prop({ required: true })
  securitySetup: boolean;

  @Prop({ required: true })
  profileFilled: boolean;

  @Prop({ required: true })
  salt: string;

  @Prop({ required: true })
  key: string;

  @Prop({ type: FetchDataErrorsSchema })
  fetchDataErrors: FetchDataErrors;

  @Prop({ required: true })
  fetchMagneticWeather: boolean;

  @Prop({ required: true })
  fetchWeather: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
