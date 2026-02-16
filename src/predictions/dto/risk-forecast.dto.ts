import { IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IRiskWeights } from '../interfaces/risk-forecast.interface';

export class RiskForecastDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    required: false,
    description: 'Custom weights for risk calculation',
  })
  @IsOptional()
  @IsObject()
  weights?: IRiskWeights;
}
