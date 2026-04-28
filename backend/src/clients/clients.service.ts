import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  list(search?: string) {
    const where: Prisma.ClientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { document: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    return this.prisma.client.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async getHistory(id: string) {
    const client = await this.findOne(id);
    const [quotes, serviceOrders, finishedOrders] = await Promise.all([
      this.prisma.quote.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.serviceOrder.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
        include: { receivables: true },
      }),
      this.prisma.serviceOrder.findMany({
        where: { clientId: id, status: 'FINISHED' },
      }),
    ]);

    const totalFaturado = finishedOrders.reduce(
      (sum, os) => sum + Number(os.totalValue),
      0,
    );
    const totalRecebido = serviceOrders.reduce(
      (sum, os) =>
        sum +
        os.receivables.reduce((s, r) => s + Number(r.paidAmount), 0),
      0,
    );
    const ticketMedio =
      finishedOrders.length > 0 ? totalFaturado / finishedOrders.length : 0;

    return {
      client,
      stats: {
        totalOrcamentos: quotes.length,
        totalOS: serviceOrders.length,
        osFinalizadas: finishedOrders.length,
        totalFaturado,
        totalRecebido,
        ticketMedio,
      },
      quotes,
      serviceOrders,
    };
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }
}
