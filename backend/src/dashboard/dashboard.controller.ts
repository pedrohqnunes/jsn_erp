import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private dash: DashboardService) {}

  @Get('overview') overview() { return this.dash.overview(); }
  @Get('top-clients') top() { return this.dash.topClients(); }
  @Get('margin-by-os') margin(@Query('months') months?: string) {
    return this.dash.marginByOS(months ? Number(months) : 3);
  }
}
