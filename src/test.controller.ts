// src/test/test.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { Roles } from './auth/decorators/roles.decorator';
import { Role } from './auth/enums/roles.enum';
import { ITestMessage } from './interfaces/test-messages';

@Controller('test')
export class TestController {
  @Public()
  @Get('public')
  getPublic(): ITestMessage {
    return { message: 'public ok' };
  }

  @Roles(Role.USER)
  @Get('private')
  getPrivate(): ITestMessage {
    return { message: 'private ok' };
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  getAdmin(): ITestMessage {
    return { message: 'admin ok' };
  }
}
