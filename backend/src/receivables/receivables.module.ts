import { Module } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';
import { ReceivablesController } from './receivables.controller';

@Module({
  providers: [ReceivablesService],
  controllers: [ReceivablesController],
})
export class ReceivablesModule {}
