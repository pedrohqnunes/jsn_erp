import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const today = new Date();
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    const [
      pendingReceivables,
      paidReceivablesMonth,
      overdueReceivables,
      pendingPayables,
      paidPayablesMonth,
      overduePayables,
      forecastReceivables,
      forecastPayables,
      ordersByStatus,
      finishedOSMonth,
      quoteCount,
      approvedQuoteCount,
      receivableSeries,
      payableSeries,
    ] = await Promise.all([
      this.prisma.receivable.aggregate({
        _sum: { expectedAmount: true },
        where: { status: 'PENDING' },
      }),
      this.prisma.receivable.aggregate({
        _sum: { paidAmount: true },
        where: { status: 'PAID', paidAt: { gte: startMonth, lte: endMonth } },
      }),
      this.prisma.receivable.aggregate({
        _sum: { expectedAmount: true },
        where: { status: 'OVERDUE' },
      }),
      this.prisma.payable.aggregate({
        _sum: { expectedAmount: true },
        where: { status: 'PENDING' },
      }),
      this.prisma.payable.aggregate({
        _sum: { paidAmount: true },
        where: { status: 'PAID', paidAt: { gte: startMonth, lte: endMonth } },
      }),
      this.prisma.payable.aggregate({
        _sum: { expectedAmount: true },
        where: { status: 'OVERDUE' },
      }),
      this.prisma.receivable.findMany({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        select: { dueDate: true, expectedAmount: true },
      }),
      this.prisma.payable.findMany({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        select: { dueDate: true, expectedAmount: true },
      }),
      this.prisma.serviceOrder.groupBy({ by: ['status'], _count: true }),
      this.prisma.serviceOrder.findMany({
        where: { status: 'FINISHED', finishedAt: { gte: startMonth, lte: endMonth } },
        select: { totalValue: true, totalCost: true, margin: true, marginPct: true, startedAt: true, finishedAt: true },
      }),
      this.prisma.quote.count(),
      this.prisma.quote.count({ where: { status: 'APPROVED' } }),
      this.prisma.receivable.findMany({
        where: { status: 'PAID', paidAt: { not: null } },
        select: { paidAt: true, paidAmount: true },
      }),
      this.prisma.payable.findMany({
        where: { status: 'PAID', paidAt: { not: null } },
        select: { paidAt: true, paidAmount: true },
      }),
    ]);

    const monthlyForecast: { month: string; toReceive: number; toPay: number; net: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const ref = addMonths(today, i);
      const s = startOfMonth(ref);
      const e = endOfMonth(ref);
      const toReceive = forecastReceivables
        .filter((r) => r.dueDate >= s && r.dueDate <= e)
        .reduce((acc, r) => acc + Number(r.expectedAmount), 0);
      const toPay = forecastPayables
        .filter((p) => p.dueDate >= s && p.dueDate <= e)
        .reduce((acc, p) => acc + Number(p.expectedAmount), 0);
      monthlyForecast.push({
        month: `${String(s.getMonth() + 1).padStart(2, '0')}/${s.getFullYear()}`,
        toReceive: Number(toReceive.toFixed(2)),
        toPay: Number(toPay.toFixed(2)),
        net: Number((toReceive - toPay).toFixed(2)),
      });
    }

    const cashFlow: { month: string; received: number; paid: number; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = addMonths(today, -i);
      const s = startOfMonth(ref);
      const e = endOfMonth(ref);
      const received = receivableSeries
        .filter((r) => r.paidAt && r.paidAt >= s && r.paidAt <= e)
        .reduce((a, r) => a + Number(r.paidAmount), 0);
      const paid = payableSeries
        .filter((p) => p.paidAt && p.paidAt >= s && p.paidAt <= e)
        .reduce((a, p) => a + Number(p.paidAmount), 0);
      cashFlow.push({
        month: `${String(s.getMonth() + 1).padStart(2, '0')}/${s.getFullYear()}`,
        received: Number(received.toFixed(2)),
        paid: Number(paid.toFixed(2)),
        net: Number((received - paid).toFixed(2)),
      });
    }

    const totalRevenueMonth = finishedOSMonth.reduce((a, o) => a + Number(o.totalValue), 0);
    const totalCostMonth = finishedOSMonth.reduce((a, o) => a + Number(o.totalCost), 0);
    const avgMarginPct = finishedOSMonth.length > 0
      ? finishedOSMonth.reduce((a, o) => a + Number(o.marginPct), 0) / finishedOSMonth.length
      : 0;

    const productionTimes = finishedOSMonth
      .filter((o) => o.startedAt && o.finishedAt)
      .map((o) => (o.finishedAt!.getTime() - o.startedAt!.getTime()) / (1000 * 60 * 60 * 24));
    const avgProductionDays = productionTimes.length > 0
      ? productionTimes.reduce((a, b) => a + b, 0) / productionTimes.length
      : 0;

    return {
      financeiro: {
        contasReceberPendente: Number(pendingReceivables._sum.expectedAmount ?? 0),
        contasReceberAtrasado: Number(overdueReceivables._sum.expectedAmount ?? 0),
        recebidoMes: Number(paidReceivablesMonth._sum.paidAmount ?? 0),
        contasPagarPendente: Number(pendingPayables._sum.expectedAmount ?? 0),
        contasPagarAtrasado: Number(overduePayables._sum.expectedAmount ?? 0),
        pagoMes: Number(paidPayablesMonth._sum.paidAmount ?? 0),
        saldoMes: Number(paidReceivablesMonth._sum.paidAmount ?? 0) - Number(paidPayablesMonth._sum.paidAmount ?? 0),
        previsao6Meses: monthlyForecast,
        fluxoCaixa6Meses: cashFlow,
      },
      operacional: {
        ordensPorStatus: ordersByStatus.reduce((acc: any, cur) => {
          acc[cur.status] = cur._count;
          return acc;
        }, {}),
        tempoMedioProducaoDias: Number(avgProductionDays.toFixed(1)),
        osFinalizadasMes: finishedOSMonth.length,
      },
      comercial: {
        totalOrcamentos: quoteCount,
        orcamentosAprovados: approvedQuoteCount,
        taxaConversao: quoteCount > 0 ? Number(((approvedQuoteCount / quoteCount) * 100).toFixed(2)) : 0,
      },
      estrategico: {
        receitaMes: Number(totalRevenueMonth.toFixed(2)),
        custoMes: Number(totalCostMonth.toFixed(2)),
        margemMes: Number((totalRevenueMonth - totalCostMonth).toFixed(2)),
        margemMediaPct: Number(avgMarginPct.toFixed(2)),
      },
    };
  }

  async topClients() {
    const orders = await this.prisma.serviceOrder.findMany({
      where: { status: 'FINISHED' },
      include: { client: true },
    });
    const map = new Map<string, { id: string; name: string; total: number; orders: number; margin: number }>();
    for (const o of orders) {
      const cur = map.get(o.clientId) ?? { id: o.clientId, name: o.client.name, total: 0, orders: 0, margin: 0 };
      cur.total += Number(o.totalValue);
      cur.margin += Number(o.margin);
      cur.orders += 1;
      map.set(o.clientId, cur);
    }
    return [...map.values()]
      .map((c) => ({
        ...c,
        ticketMedio: c.orders > 0 ? Number((c.total / c.orders).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }

  async marginByOS(months = 3) {
    const since = startOfMonth(addMonths(new Date(), -(months - 1)));
    const orders = await this.prisma.serviceOrder.findMany({
      where: { status: 'FINISHED', finishedAt: { gte: since } },
      include: { client: true },
      orderBy: { finishedAt: 'desc' },
    });
    return orders.map((o) => ({
      id: o.id,
      number: o.number,
      client: o.client.name,
      finishedAt: o.finishedAt,
      totalValue: Number(o.totalValue),
      totalCost: Number(o.totalCost),
      margin: Number(o.margin),
      marginPct: Number(o.marginPct),
    }));
  }
}
