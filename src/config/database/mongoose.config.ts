// src/database/mongoose.config.ts
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: process.env.MONGODB_URI || 'mongodb://localhost/migraine-tracker',
      dbName: process.env.MONGODB_DB_NAME || 'migraine-tracker',
      retryAttempts: 10,
      retryDelay: 5,
    };
  }
}
