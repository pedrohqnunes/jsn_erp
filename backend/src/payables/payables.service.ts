import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayableDto, PayPayableDto, UpdatePayableDto } from './dto';

@Injectable()
export class PayablesService {
  constructor(private prisma: PrismaService) {}

  list(params: { status?: string; category?: string; from?: string; to?: string }) {
    const where: Prisma.PayableWhereInput = {};
    if (params.status) where.status = params.status as any;
    if (params.category) where.category = params.category;
    if (params.from || params.to) {
      where.dueDate = {};
      if (params.from) (where.dueDate as any).gte = new Date(params.from);
      if (params.to) (where.dueDate as any).lte = new Date(params.to);
    }
    return this.prisma.payable.findMany({ where, orderBy: { dueDate: 'asc' } });
  }

  async findOne(id: string) {
    const p = await this.prisma.payable.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Conta a pagar não encontrada');
    return p;
  }

  create(dto: CreatePayableDto) {
    return this.prisma.payable.create({
      data: { ...dto, dueDate: new Date(dto.dueDate) },
    });
  }

  async update(id: string, dto: UpdatePayableDto) {
    await this.findOne(id);
    return this.prisma.payable.update({
      where: { id },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async pay(id: string, dto: PayPayableDto) {
    const p = await this.findOne(id);
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    const updated = await this.prisma.payable.update({
      where: { id },
      data: {
        paidAmount: dto.paidAmount,
        paidAt,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes ?? p.notes,
        status: 'PAID',
      },
    });

    if (p.recurring && p.recurringFrequency) {
      const nextDue = new Date(p.dueDate);
      switch (p.recurringFrequency) {
        case 'WEEKLY': nextDue.setDate(nextDue.getDate() + 7); break;
        case 'MONTHLY': nextDue.setMonth(nextDue.getMonth() + 1); break;
        case 'QUARTERLY': nextDue.setMonth(nextDue.getMonth() + 3); break;
        case 'YEARLY': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
      }
      await this.prisma.payable.create({
        data: {
          description: p.description,
          category: p.category,
          account: p.account,
          dueDate: nextDue,
          expectedAmount: p.expectedAmount,
          recurring: true,
          recurringFrequency: p.recurringFrequency,
          notes: p.notes,
          employeeId: p.employeeId,
        },
      });
    }
    return updated;
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.payable.update({ where: { id }, data: { status: 'CANCELED' } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payable.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.prisma.payable.updateMany({
      where: { status: 'PENDING', dueDate: { lt: today } },
      data: { status: 'OVERDUE' },
    });
  }
}
