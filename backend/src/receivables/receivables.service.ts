import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PayReceivableDto, UpdateReceivableDto } from './dto';

@Injectable()
export class ReceivablesService {
  constructor(private prisma: PrismaService) {}

  list(params: { status?: string; clientId?: string; from?: string; to?: string }) {
    const where: Prisma.ReceivableWhereInput = {};
    if (params.status) where.status = params.status as any;
    if (params.clientId) where.serviceOrder = { clientId: params.clientId };
    if (params.from || params.to) {
      where.dueDate = {};
      if (params.from) (where.dueDate as any).gte = new Date(params.from);
      if (params.to) (where.dueDate as any).lte = new Date(params.to);
    }
    return this.prisma.receivable.findMany({
      where,
      include: { serviceOrder: { include: { client: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const r = await this.prisma.receivable.findUnique({
      where: { id },
      include: { serviceOrder: { include: { client: true } } },
    });
    if (!r) throw new NotFoundException('Conta a receber não encontrada');
    return r;
  }

  async pay(id: string, dto: PayReceivableDto) {
    const r = await this.findOne(id);
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    return this.prisma.receivable.update({
      where: { id },
      data: {
        paidAmount: dto.paidAmount,
        paidAt,
        paymentMethod: dto.paymentMethod,
        bank: dto.bank,
        notes: dto.notes ?? r.notes,
        status: 'PAID',
      },
    });
  }

  async update(id: string, dto: UpdateReceivableDto) {
    await this.findOne(id);
    return this.prisma.receivable.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        expectedAmount: dto.expectedAmount,
        notes: dto.notes,
      },
    });
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.receivable.update({ where: { id }, data: { status: 'CANCELED' } });
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.prisma.receivable.updateMany({
      where: { status: 'PENDING', dueDate: { lt: today } },
      data: { status: 'OVERDUE' },
    });
  }
}
