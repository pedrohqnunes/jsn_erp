import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PayablesService } from './payables.service';
import { CreatePayableDto, PayPayableDto, UpdatePayableDto } from './dto';

@Controller('payables')
export class PayablesController {
  constructor(private pay: PayablesService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pay.list({ status, category, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pay.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePayableDto) {
    return this.pay.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePayableDto) {
    return this.pay.update(id, dto);
  }

  @Post(':id/pay')
  payNow(@Param('id') id: string, @Body() dto: PayPayableDto) {
    return this.pay.pay(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.pay.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pay.remove(id);
  }
}
