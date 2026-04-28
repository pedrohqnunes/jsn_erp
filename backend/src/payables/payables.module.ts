import { Module } from '@nestjs/common';
import { PayablesService } from './payables.service';
import { PayablesController } from './payables.controller';

@Module({
  providers: [PayablesService],
  controllers: [PayablesController],
})
export class PayablesModule {}
