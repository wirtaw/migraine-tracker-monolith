import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Param,
  Patch,
} from '@nestjs/common';
import { PredictionsService } from '../services/predictions.service';
import { UserService } from '../../users/users.service';
import { ApiOperation } from '@nestjs/swagger';
import { RiskForecastDto } from '../dto/risk-forecast.dto';
import { CreatePredictionRuleDto } from '../dto/create-prediction-rule.dto';
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
    let latitude: number;
    let longitude: number;

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      latitude = dto.latitude;
      longitude = dto.longitude;
    } else {
      const user: IUser = await this.userService.findOne(req.session.userId);
      latitude = parseFloat(user.latitude);
      longitude = parseFloat(user.longitude);
    }

    return this.predictionsService.getRiskForecast(
      req.session.userId,
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
    return this.predictionsService.createRule(req.session.userId, dto);
  }

  @Roles(Role.USER)
  @Get('rules')
  @ApiOperation({ summary: 'Get user prediction rules' })
  async getRules(
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['getRules']>> {
    return this.predictionsService.getRules(req.session.userId);
  }

  @Roles(Role.USER)
  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['getNotifications']>> {
    return this.predictionsService.getNotifications(req.session.userId);
  }

  @Roles(Role.USER)
  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ReturnType<PredictionsService['markNotificationAsRead']>> {
    return this.predictionsService.markNotificationAsRead(
      req.session.userId,
      id,
    );
  }
}
