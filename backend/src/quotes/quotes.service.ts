import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { ApproveAndConvertDto, CreateQuoteDto, QuoteItemDto, UpdateQuoteDto } from './dto';

function totals(items: QuoteItemDto[]) {
  let totalValue = 0;
  let totalCost = 0;
  const computed = items.map((it) => {
    const totalPrice = Number((it.quantity * it.unitPrice).toFixed(2));
    const totalC = Number((it.quantity * (it.unitCost ?? 0)).toFixed(2));
    totalValue += totalPrice;
    totalCost += totalC;
    return {
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      unitCost: it.unitCost ?? 0,
      totalPrice,
      totalCost: totalC,
    };
  });
  const margin = Number((totalValue - totalCost).toFixed(2));
  const marginPct = totalValue > 0 ? Number(((margin / totalValue) * 100).toFixed(2)) : 0;
  return { items: computed, totalValue, totalCost, margin, marginPct };
}

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private osService: ServiceOrdersService,
  ) {}

  list(status?: string, clientId?: string) {
    return this.prisma.quote.findMany({
      where: {
        status: status as any,
        clientId: clientId,
      },
      include: { client: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { client: true, items: true, serviceOrder: true },
    });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');
    return quote;
  }

  async create(dto: CreateQuoteDto) {
    const t = totals(dto.items);
    return this.prisma.quote.create({
      data: {
        clientId: dto.clientId,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        totalValue: t.totalValue,
        totalCost: t.totalCost,
        margin: t.margin,
        marginPct: t.marginPct,
        items: { create: t.items },
      },
      include: { items: true, client: true },
    });
  }

  async update(id: string, dto: UpdateQuoteDto) {
    const existing = await this.findOne(id);
    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Só é possível alterar orçamentos pendentes');
    }

    if (!dto.items) {
      return this.prisma.quote.update({
        where: { id },
        data: {
          clientId: dto.clientId ?? undefined,
          notes: dto.notes ?? undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        },
        include: { items: true, client: true },
      });
    }

    const t = totals(dto.items);
    return this.prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      return tx.quote.update({
        where: { id },
        data: {
          clientId: dto.clientId ?? undefined,
          notes: dto.notes ?? undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          totalValue: t.totalValue,
          totalCost: t.totalCost,
          margin: t.margin,
          marginPct: t.marginPct,
          items: { create: t.items },
        },
        include: { items: true, client: true },
      });
    });
  }

  async changeStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const quote = await this.findOne(id);
    if (quote.serviceOrder) throw new BadRequestException('Orçamento já convertido em OS');
    return this.prisma.quote.update({ where: { id }, data: { status } });
  }

  async approveAndConvert(id: string, dto: ApproveAndConvertDto) {
    const quote = await this.findOne(id);
    if (quote.serviceOrder) throw new BadRequestException('Orçamento já convertido em OS');

    return this.prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id }, data: { status: 'APPROVED' } });
      return this.osService.createFromQuote(tx as any, quote, dto);
    });
  }

  async remove(id: string) {
    const quote = await this.findOne(id);
    if (quote.serviceOrder) throw new BadRequestException('Não é possível excluir: orçamento já gerou OS');
    return this.prisma.quote.delete({ where: { id } });
  }
}
