// src/test/test.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { Roles } from './auth/decorators/roles.decorator';
import { Role } from './auth/enums/roles.enum';

@Controller('test')
export class TestController {
  @Public()
  @Get('public')
  getPublic() {
    return { message: 'public ok' };
  }

  @Get('private')
  getPrivate() {
    return { message: 'private ok' };
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  getAdmin() {
    return { message: 'admin ok' };
  }
}
