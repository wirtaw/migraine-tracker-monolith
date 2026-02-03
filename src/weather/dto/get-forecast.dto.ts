import { IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetForecastDto {
  @ApiProperty({
    description: 'Latitude of the location',
    example: 52.52,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number | undefined;

  @ApiProperty({
    description: 'Longitude of the location',
    example: 13.41,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number | undefined;
}
