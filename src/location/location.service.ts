import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationService {
  create(createLocationDto: CreateLocationDto) {
    return `This action adds a new location ${JSON.stringify(createLocationDto)}`;
  }

  findAll() {
    return `This action returns all location`;
  }

  findOne(id: number) {
    return `This action returns a #${id} location`;
  }

  update(id: number, updateLocationDto: UpdateLocationDto) {
    return `This action updates a #${id} location ${JSON.stringify(updateLocationDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} location`;
  }
}
