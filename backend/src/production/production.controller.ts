import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateStageDto, UpdateStageDto } from './dto';

@Controller('production')
export class ProductionController {
  constructor(private prod: ProductionService) {}

  @Get('board')
  board() {
    return this.prod.board();
  }

  @Get('stages')
  listStages(@Query('serviceOrderId') serviceOrderId: string) {
    return this.prod.listStages(serviceOrderId);
  }

  @Post('stages')
  createStage(@Body() dto: CreateStageDto) {
    return this.prod.createStage(dto);
  }

  @Patch('stages/:id')
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.prod.updateStage(id, dto);
  }

  @Delete('stages/:id')
  removeStage(@Param('id') id: string) {
    return this.prod.removeStage(id);
  }
}
