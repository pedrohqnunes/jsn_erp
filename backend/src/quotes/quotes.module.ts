import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { QuotePdfService } from './quote-pdf.service';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';

@Module({
  imports: [ServiceOrdersModule],
  providers: [QuotesService, QuotePdfService],
  controllers: [QuotesController],
})
export class QuotesModule {}
