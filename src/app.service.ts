import { Injectable } from '@nestjs/common';
import { AppDict } from './enums/index';

@Injectable()
export class AppService {
  getHello(): string {
    return AppDict.welcome;
  }

  getStatus(): { status: string } {
    return { status: 'ok' };
  }
}
