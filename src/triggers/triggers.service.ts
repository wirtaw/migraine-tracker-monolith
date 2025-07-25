import { Injectable } from '@nestjs/common';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';

@Injectable()
export class TriggersService {
  create(createTriggerDto: CreateTriggerDto) {
    return `This action adds a new trigger ${JSON.stringify(createTriggerDto)}`;
  }

  findAll() {
    return `This action returns all triggers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} trigger`;
  }

  update(id: number, updateTriggerDto: UpdateTriggerDto) {
    return `This action updates a #${id} trigger ${JSON.stringify(updateTriggerDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} trigger`;
  }
}
