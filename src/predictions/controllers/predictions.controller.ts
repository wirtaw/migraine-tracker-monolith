import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { PredictionsService } from '../services/predictions.service';
import { UserService } from '../../users/users.service';
import { ApiOperation } from '@nestjs/swagger';
import { RiskForecastDto } from '../dto/risk-forecast.dto';
import { CreatePredictionRuleDto } from '../dto/create-prediction-rule.dto';
import { UpdatePredictionRuleDto } from '../dto/update-prediction-rule.dto';
import { RequestWithUser } from '../../auth/interfaces/auth.user.interface';
import { IUser } from '../../users/interfaces/user.interface';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/roles.enum';

@Controller('predictions')
export class PredictionsController {
  constructor(
    private readonly predictionsService: PredictionsService,
    private readonly userService: UserService,
  ) {}

  @Roles(Role.USER)
  @Get('risk-forecast')
  @ApiOperation({ summary: 'Get holistic risk score for today/tomorrow' })
  async getRiskForecast(
    @Query() dto: RiskForecastDto,
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['getRiskForecast']>> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    let latitude: number;
    let longitude: number;

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      latitude = dto.latitude;
      longitude = dto.longitude;
    } else {
      const user: IUser = await this.userService.findOneByExternal(userId);
      latitude = parseFloat(user.latitude);
      longitude = parseFloat(user.longitude);
    }

    return this.predictionsService.getRiskForecast(
      userId,
      latitude,
      longitude,
      encryptionKey,
      dto.weights,
    );
  }

  @Roles(Role.USER)
  @Post('rules')
  @ApiOperation({ summary: 'Create a prediction rule' })
  async createRule(
    @Body() dto: CreatePredictionRuleDto,
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['createRule']>> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.predictionsService.createRule(userId, dto);
  }

  @Roles(Role.USER)
  @Get('rules')
  @ApiOperation({ summary: 'Get user prediction rules' })
  async getRules(
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['getRules']>> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.predictionsService.getRules(userId);
  }

  @Roles(Role.USER)
  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update a prediction rule' })
  async updateRule(
    @Param('id') id: string,
    @Body() dto: UpdatePredictionRuleDto,
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['updateRule']>> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.predictionsService.updateRule(userId, id, dto);
  }

  @Roles(Role.USER)
  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete a prediction rule' })
  async deleteRule(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.predictionsService.deleteRule(userId, id);
  }

  @Roles(Role.USER)
  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['getNotifications']>> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.predictionsService.getNotifications(userId);
  }

  @Roles(Role.USER)
  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['markNotificationAsRead']>> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.predictionsService.markNotificationAsRead(userId, id);
  }
}
