import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  tag: string;
  href: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string): Promise<SearchResult[]> {
    if (!q || q.trim().length < 2) return [];
    const term = q.trim();
    const numTerm = /^\d+$/.test(term) ? parseInt(term) : null;

    const [clients, quotes, serviceOrders, employees, payables] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { document: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 6,
      }),
      this.prisma.quote.findMany({
        where: {
          OR: [
            { client: { name: { contains: term, mode: 'insensitive' } } },
            ...(numTerm !== null ? [{ number: numTerm }] : []),
          ],
        },
        include: { client: { select: { name: true } } },
        orderBy: { number: 'desc' },
        take: 6,
      }),
      this.prisma.serviceOrder.findMany({
        where: {
          OR: [
            { description: { contains: term, mode: 'insensitive' } },
            { client: { name: { contains: term, mode: 'insensitive' } } },
            ...(numTerm !== null ? [{ number: numTerm }] : []),
          ],
        },
        include: { client: { select: { name: true } } },
        orderBy: { number: 'desc' },
        take: 6,
      }),
      this.prisma.employee.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { role: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.payable.findMany({
        where: {
          OR: [
            { description: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } },
          ],
        },
        orderBy: { dueDate: 'desc' },
        take: 5,
      }),
    ]);

    const raw: SearchResult[] = [
      ...clients.map((c) => ({
        id: c.id,
        label: c.name,
        sublabel: [c.document, c.email].filter(Boolean).join(' · ') || undefined,
        tag: 'Clientes',
        href: `/clientes/${c.id}`,
      })),
      ...quotes.map((q) => ({
        id: q.id,
        label: `Orçamento #${q.number}`,
        sublabel: q.client.name,
        tag: 'Orçamentos',
        href: `/orcamentos/${q.id}`,
      })),
      ...serviceOrders.map((os) => ({
        id: os.id,
        label: `OS #${os.number}`,
        sublabel: `${os.client.name} — ${os.description.substring(0, 50)}`,
        tag: 'Ordens de Serviço',
        href: `/ordens-servico/${os.id}`,
      })),
      ...employees.map((e) => ({
        id: e.id,
        label: e.name,
        sublabel: e.role,
        tag: 'Funcionários',
        href: `/funcionarios`,
      })),
      ...payables.map((p) => ({
        id: p.id,
        label: p.description,
        sublabel: p.category,
        tag: 'Contas a Pagar',
        href: `/contas-pagar`,
      })),
    ];

    const seen = new Set<string>();
    return raw
      .filter((r) => {
        const key = `${r.tag}:${r.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 25);
  }
}
