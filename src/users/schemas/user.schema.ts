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

  @Prop({ required: true, unique: true })
  supabaseId: string;

  @Prop({ required: true })
  longitude: string;

  @Prop({ required: true })
  latitude: string;

  @Prop({ required: true })
  birthDate: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false, default: true })
  emailNotifications: boolean;

  @Prop({ required: false, default: false })
  dailySummary: boolean;

  @Prop({ required: false, default: false })
  personalHealthData: boolean;

  @Prop({ required: false, default: false })
  securitySetup: boolean;

  @Prop({ required: false, default: false })
  profileFilled: boolean;

  @Prop({ required: true })
  salt: string;

  @Prop({ required: true })
  encryptedSymmetricKey: string; // Renamed from key

  @Prop({ type: FetchDataErrorsSchema, required: false })
  fetchDataErrors: FetchDataErrors;

  @Prop({ required: false, default: true })
  fetchMagneticWeather: boolean;

  @Prop({ required: false, default: true })
  fetchWeather: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
