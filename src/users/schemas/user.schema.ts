import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../auth/enums/roles.enum';

export type UserDocument = User & Document;

@Schema()
class FetchDataErrors {
  @Prop({ required: true })
  forecast!: string;

  @Prop({ required: true })
  magneticWeather!: string;
}

const FetchDataErrorsSchema = SchemaFactory.createForClass(FetchDataErrors);

@Schema({ _id: false })
class UserStatistics {
  @Prop({ default: 0 })
  dbUsageBytes!: number;

  @Prop({ default: 0 })
  weatherApiRequests!: number;

  @Prop({ default: 0 })
  solarApiRequests!: number;

  @Prop({ default: Date.now })
  lastUpdated!: Date;
}

const UserStatisticsSchema = SchemaFactory.createForClass(UserStatistics);

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ required: true, unique: true })
  supabaseId!: string;

  @Prop({ required: true })
  longitude!: string;

  @Prop({ required: true })
  latitude!: string;

  @Prop({ required: true })
  birthDate!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: false, default: true })
  emailNotifications?: boolean;

  @Prop({ required: false, default: false })
  dailySummary?: boolean;

  @Prop({ required: false, default: false })
  personalHealthData?: boolean;

  @Prop({ required: false, default: false })
  securitySetup?: boolean;

  @Prop({ required: false, default: false })
  profileFilled?: boolean;

  @Prop({ required: true })
  salt!: string;

  @Prop({ required: true })
  encryptedSymmetricKey!: string;

  @Prop({ type: FetchDataErrorsSchema, required: false })
  fetchDataErrors?: FetchDataErrors;

  @Prop({ required: false, default: true })
  fetchMagneticWeather?: boolean;

  @Prop({ required: false, default: true })
  fetchWeather?: boolean;

  @Prop({ required: false, default: Role.GUEST })
  role!: string;

  @Prop({ type: UserStatisticsSchema, required: false, default: () => ({}) })
  statistics?: UserStatistics;
}

export const UserSchema = SchemaFactory.createForClass(User);
