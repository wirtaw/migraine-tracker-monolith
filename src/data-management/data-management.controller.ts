import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DataManagementService } from './data-management.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataValidationResponse } from './interface/validation.interface';
import type { Express } from 'express';
import 'multer';
import { ErrorExceptionLogging } from '../utils/error.exception';
import { JsonSchema } from './utils/dto-to-json-schema';

@Controller('data-management')
export class DataManagementController {
  constructor(private readonly dataManagementService: DataManagementService) {}

  @Roles(Role.USER)
  @Get('schema')
  getSchema(): JsonSchema {
    return this.dataManagementService.getSchema();
  }

  @Roles(Role.USER)
  @Post('validate-upload')
  @UseInterceptors(FileInterceptor('file'))
  validateFile(
    @UploadedFile() file: Express.Multer.File,
  ): DataValidationResponse {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.mimetype !== 'application/json') {
      throw new BadRequestException('Uploaded file must be a JSON file.');
    }

    try {
      const fileContent: string = file.buffer.toString('utf-8');

      const jsonData: unknown = JSON.parse(fileContent);

      const validationResult: unknown =
        this.dataManagementService.validateImportData(jsonData);

      if (validationResult instanceof Error) {
        throw new BadRequestException(validationResult.message);
      }

      return validationResult as DataValidationResponse;
    } catch (error) {
      ErrorExceptionLogging(error, DataManagementController.name);
      throw error;
    }
  }
}
