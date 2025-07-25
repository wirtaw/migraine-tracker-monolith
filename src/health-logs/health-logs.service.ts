import { Injectable } from '@nestjs/common';
import { CreateHealthLogDto } from './dto/create-health-log.dto';
import { UpdateHealthLogDto } from './dto/update-health-log.dto';

@Injectable()
export class HealthLogsService {
  create(createHealthLogDto: CreateHealthLogDto) {
    return `This action adds a new healthLog ${JSON.stringify(createHealthLogDto)}`;
  }

  findAll() {
    return `This action returns all healthLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} healthLog`;
  }

  update(id: number, updateHealthLogDto: UpdateHealthLogDto) {
    return `This action updates a #${id} healthLog ${JSON.stringify(updateHealthLogDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} healthLog`;
  }
}
