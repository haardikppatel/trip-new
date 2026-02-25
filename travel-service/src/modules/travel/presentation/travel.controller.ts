import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TravelService } from '../application/travel.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { RbacGuard, Roles } from '@tripaxis/core';

@ApiTags('Travel Requests')
@ApiBearerAuth()
@Controller('v1/travel-requests')
@UseGuards(RbacGuard)
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post()
  @Roles('Employee', 'Manager')
  @ApiOperation({ summary: 'Create a new travel request' })
  @ApiResponse({ status: 201, description: 'Travel request created successfully.' })
  @ApiResponse({ status: 400, description: 'Policy validation failed.' })
  async create(@Body() createTravelDto: CreateTravelDto) {
    return this.travelService.createTravelRequest(createTravelDto);
  }
}
