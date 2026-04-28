import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed iniciado...');

  const adminPwd = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@jsn.local' },
    update: {},
    create: {
      email: 'admin@jsn.local',
      password: adminPwd,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { id: 'emp-1' },
      update: {},
      create: { id: 'emp-1', name: 'Carlos Silva', role: 'Pintor' },
    }),
    prisma.employee.upsert({
      where: { id: 'emp-2' },
      update: {},
      create: { id: 'emp-2', name: 'Ana Souza', role: 'Supervisora de produção' },
    }),
  ]);

  const c1 = await prisma.client.upsert({
    where: { id: 'cli-1' },
    update: {},
    create: {
      id: 'cli-1',
      type: 'PJ',
      name: 'Metalúrgica Andrade Ltda',
      document: '12.345.678/0001-99',
      email: 'compras@metandrade.com.br',
      phone: '(11) 4002-8922',
      city: 'São Bernardo',
      state: 'SP',
    },
  });

  const c2 = await prisma.client.upsert({
    where: { id: 'cli-2' },
    update: {},
    create: {
      id: 'cli-2',
      type: 'PJ',
      name: 'Esquadrias Sul SA',
      document: '98.765.432/0001-10',
      email: 'pedidos@esquadriassul.com',
      phone: '(11) 3322-1100',
      city: 'Diadema',
      state: 'SP',
    },
  });

  // Orçamento aprovado já convertido
  const quote = await prisma.quote.create({
    data: {
      clientId: c1.id,
      status: 'APPROVED',
      notes: 'Pintura em pó cor preto fosco RAL 9005',
      totalValue: 4800,
      totalCost: 2200,
      margin: 2600,
      marginPct: 54.17,
      items: {
        create: [
          { description: 'Pintura eletrostática em estrutura metálica', quantity: 80, unitPrice: 50, unitCost: 22, totalPrice: 4000, totalCost: 1760 },
          { description: 'Pré-tratamento (desengraxe + fosfatização)', quantity: 1, unitPrice: 800, unitCost: 440, totalPrice: 800, totalCost: 440 },
        ],
      },
    },
  });

  const today = new Date();
  const due1 = new Date(today); due1.setDate(due1.getDate() + 30);
  const due2 = new Date(today); due2.setDate(due2.getDate() + 60);

  const os = await prisma.serviceOrder.create({
    data: {
      quoteId: quote.id,
      clientId: c1.id,
      description: '80x Pintura eletrostática | 1x Pré-tratamento',
      totalValue: 4800,
      totalCost: 2200,
      margin: 2600,
      marginPct: 54.17,
      paymentTerms: 'INSTALLMENTS',
      installments: 2,
      firstDueDate: due1,
      status: 'IN_PRODUCTION',
      startedAt: today,
      responsibleId: employees[1].id,
      productionStages: {
        create: [
          { name: 'Pré-tratamento', order: 0, status: 'DONE', startedAt: today, finishedAt: today, responsibleId: employees[0].id },
          { name: 'Pintura', order: 1, status: 'IN_PROGRESS', startedAt: today, responsibleId: employees[0].id },
          { name: 'Cura', order: 2, status: 'PENDING' },
          { name: 'Acabamento', order: 3, status: 'PENDING' },
          { name: 'Inspeção', order: 4, status: 'PENDING' },
        ],
      },
      receivables: {
        create: [
          { installment: 1, totalInstallments: 2, dueDate: due1, expectedAmount: 2400 },
          { installment: 2, totalInstallments: 2, dueDate: due2, expectedAmount: 2400 },
        ],
      },
    },
  });

  // Orçamento pendente
  await prisma.quote.create({
    data: {
      clientId: c2.id,
      status: 'PENDING',
      notes: 'Aguardando aprovação',
      totalValue: 1500,
      totalCost: 700,
      margin: 800,
      marginPct: 53.33,
      items: {
        create: [
          { description: 'Pintura em portões 2.20 x 1.10m', quantity: 5, unitPrice: 300, unitCost: 140, totalPrice: 1500, totalCost: 700 },
        ],
      },
    },
  });

  // Despesas
  const dueRent = new Date(today); dueRent.setDate(5); dueRent.setMonth(dueRent.getMonth() + 1);
  await prisma.payable.createMany({
    data: [
      { description: 'Aluguel galpão', category: 'Infraestrutura', dueDate: dueRent, expectedAmount: 4500, recurring: true, recurringFrequency: 'MONTHLY' },
      { description: 'Energia elétrica', category: 'Utilidades', dueDate: new Date(today.getTime() + 7 * 86400000), expectedAmount: 1800, recurring: true, recurringFrequency: 'MONTHLY' },
      { description: 'Tinta em pó - lote 12', category: 'Insumos', dueDate: new Date(today.getTime() + 15 * 86400000), expectedAmount: 3200 },
    ],
  });

  console.log('Seed concluído. Login: admin@jsn.local / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
