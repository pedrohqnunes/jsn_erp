import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { ChangeOSStatusDto, CreateOSDto, UpdateOSDto } from './dto';

@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private os: ServiceOrdersService) {}

  @Get()
  list(@Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.os.list(status, clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.os.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOSDto) {
    return this.os.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOSDto) {
    return this.os.update(id, dto);
  }

  @Patch(':id/status')
  status(@Param('id') id: string, @Body() dto: ChangeOSStatusDto) {
    return this.os.changeStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.os.remove(id);
  }
}
