import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';
import { PayReceivableDto, UpdateReceivableDto } from './dto';

@Controller('receivables')
export class ReceivablesController {
  constructor(private rec: ReceivablesService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.rec.list({ status, clientId, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rec.findOne(id);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string, @Body() dto: PayReceivableDto) {
    return this.rec.pay(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReceivableDto) {
    return this.rec.update(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.rec.cancel(id);
  }
}
