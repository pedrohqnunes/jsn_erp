import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OSStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeOSStatusDto, CreateOSDto, UpdateOSDto } from './dto';

const DEFAULT_STAGES = [
  'Pré-tratamento',
  'Pintura',
  'Cura',
  'Acabamento',
  'Inspeção',
];

@Injectable()
export class ServiceOrdersService {
  constructor(private prisma: PrismaService) {}

  list(status?: string, clientId?: string) {
    return this.prisma.serviceOrder.findMany({
      where: { status: status as OSStatus, clientId },
      include: { client: true, responsible: true, receivables: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const os = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        responsible: true,
        receivables: { orderBy: { installment: 'asc' } },
        productionStages: { orderBy: { order: 'asc' } },
        quote: { include: { items: true } },
      },
    });
    if (!os) throw new NotFoundException('OS não encontrada');
    return os;
  }

  async create(dto: CreateOSDto) {
    const totalCost = dto.totalCost ?? 0;
    const margin = Number((dto.totalValue - totalCost).toFixed(2));
    const marginPct = dto.totalValue > 0 ? Number(((margin / dto.totalValue) * 100).toFixed(2)) : 0;
    const installments = dto.paymentTerms === 'INSTALLMENTS' ? (dto.installments ?? 1) : 1;
    const firstDueDate = dto.firstDueDate ? new Date(dto.firstDueDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const os = await tx.serviceOrder.create({
        data: {
          clientId: dto.clientId,
          description: dto.description,
          totalValue: dto.totalValue,
          totalCost,
          margin,
          marginPct,
          paymentTerms: dto.paymentTerms ?? 'CASH',
          installments,
          firstDueDate,
          responsibleId: dto.responsibleId,
          status: 'WAITING_PRODUCTION',
          productionStages: {
            create: DEFAULT_STAGES.map((name, i) => ({ name, order: i })),
          },
        },
      });
      await this.generateReceivables(tx, os.id, dto.totalValue, installments, firstDueDate);
      return os;
    });
  }

  async createFromQuote(tx: Prisma.TransactionClient, quote: any, opts: {
    paymentTerms?: 'CASH' | 'INSTALLMENTS' | 'ON_DELIVERY';
    installments?: number;
    firstDueDate?: string;
  }) {
    const installments = opts.paymentTerms === 'INSTALLMENTS' ? (opts.installments ?? 1) : 1;
    const firstDueDate = opts.firstDueDate ? new Date(opts.firstDueDate) : new Date();

    const os = await tx.serviceOrder.create({
      data: {
        quoteId: quote.id,
        clientId: quote.clientId,
        description: quote.items.map((i: any) => `${i.quantity}x ${i.description}`).join(' | '),
        totalValue: quote.totalValue,
        totalCost: quote.totalCost,
        margin: quote.margin,
        marginPct: quote.marginPct,
        paymentTerms: opts.paymentTerms ?? 'CASH',
        installments,
        firstDueDate,
        status: 'WAITING_PRODUCTION',
        productionStages: {
          create: DEFAULT_STAGES.map((name, i) => ({ name, order: i })),
        },
      },
    });
    await this.generateReceivables(tx, os.id, Number(quote.totalValue), installments, firstDueDate);
    return os;
  }

  private async generateReceivables(
    tx: Prisma.TransactionClient,
    serviceOrderId: string,
    totalValue: number,
    installments: number,
    firstDueDate: Date,
  ) {
    const base = Number((totalValue / installments).toFixed(2));
    const remainder = Number((totalValue - base * installments).toFixed(2));

    const data = Array.from({ length: installments }).map((_, i) => {
      const due = new Date(firstDueDate);
      due.setMonth(due.getMonth() + i);
      const amount = i === installments - 1 ? Number((base + remainder).toFixed(2)) : base;
      return {
        serviceOrderId,
        installment: i + 1,
        totalInstallments: installments,
        dueDate: due,
        expectedAmount: amount,
      };
    });
    await tx.receivable.createMany({ data });
  }

  async update(id: string, dto: UpdateOSDto) {
    await this.findOne(id);
    return this.prisma.serviceOrder.update({
      where: { id },
      data: dto,
    });
  }

  async changeStatus(id: string, status: ChangeOSStatusDto['status']) {
    const os = await this.findOne(id);

    const validTransitions: Record<OSStatus, OSStatus[]> = {
      WAITING_APPROVAL: ['WAITING_PRODUCTION', 'CANCELED'],
      WAITING_PRODUCTION: ['IN_PRODUCTION', 'CANCELED'],
      IN_PRODUCTION: ['FINISHED', 'CANCELED'],
      FINISHED: [],
      CANCELED: [],
    };
    if (!validTransitions[os.status].includes(status)) {
      throw new BadRequestException(`Transição inválida: ${os.status} → ${status}`);
    }

    const data: Prisma.ServiceOrderUpdateInput = { status };
    if (status === 'IN_PRODUCTION' && !os.startedAt) data.startedAt = new Date();
    if (status === 'FINISHED') data.finishedAt = new Date();
    if (status === 'CANCELED') {
      await this.prisma.receivable.updateMany({
        where: { serviceOrderId: id, status: 'PENDING' },
        data: { status: 'CANCELED' },
      });
    }

    return this.prisma.serviceOrder.update({ where: { id }, data });
  }

  async remove(id: string) {
    const os = await this.findOne(id);
    if (os.status === 'IN_PRODUCTION' || os.status === 'FINISHED') {
      throw new BadRequestException('Não é possível excluir OS em produção ou finalizadas');
    }
    return this.prisma.serviceOrder.delete({ where: { id } });
  }
}
