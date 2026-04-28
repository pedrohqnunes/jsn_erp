import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { QuotesService } from './quotes.service';
import { QuotePdfService } from './quote-pdf.service';
import {
  ApproveAndConvertDto, ChangeQuoteStatusDto, CreateQuoteDto, UpdateQuoteDto,
} from './dto';

@Controller('quotes')
export class QuotesController {
  constructor(
    private quotes: QuotesService,
    private pdf: QuotePdfService,
  ) {}

  @Get()
  list(@Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.quotes.list(status, clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotes.findOne(id);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.pdf.generate(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="orcamento-${id}.pdf"`);
    res.end(buffer);
  }

  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotes.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotes.update(id, dto);
  }

  @Patch(':id/status')
  status(@Param('id') id: string, @Body() dto: ChangeQuoteStatusDto) {
    return this.quotes.changeStatus(id, dto.status);
  }

  @Post(':id/convert')
  convert(@Param('id') id: string, @Body() dto: ApproveAndConvertDto) {
    return this.quotes.approveAndConvert(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotes.remove(id);
  }
}
