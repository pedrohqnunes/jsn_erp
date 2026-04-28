import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStageDto, UpdateStageDto } from './dto';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async board() {
    const orders = await this.prisma.serviceOrder.findMany({
      where: { status: { in: ['WAITING_PRODUCTION', 'IN_PRODUCTION'] } },
      include: {
        client: true,
        responsible: true,
        productionStages: {
          orderBy: { order: 'asc' },
          include: { responsible: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      WAITING_PRODUCTION: orders.filter((o) => o.status === 'WAITING_PRODUCTION'),
      IN_PRODUCTION: orders.filter((o) => o.status === 'IN_PRODUCTION'),
    };
  }

  listStages(serviceOrderId: string) {
    return this.prisma.productionStage.findMany({
      where: { serviceOrderId },
      orderBy: { order: 'asc' },
      include: { responsible: true },
    });
  }

  createStage(dto: CreateStageDto) {
    return this.prisma.productionStage.create({ data: dto });
  }

  async updateStage(id: string, dto: UpdateStageDto) {
    const stage = await this.prisma.productionStage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('Etapa não encontrada');

    const data: any = { ...dto };
    if (dto.status === 'IN_PROGRESS' && !stage.startedAt) data.startedAt = new Date();
    if (dto.status === 'DONE') data.finishedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.productionStage.update({ where: { id }, data });

      const all = await tx.productionStage.findMany({ where: { serviceOrderId: stage.serviceOrderId } });
      const anyInProgress = all.some((s) => s.status === 'IN_PROGRESS');
      const allDone = all.length > 0 && all.every((s) => s.status === 'DONE');

      const os = await tx.serviceOrder.findUnique({ where: { id: stage.serviceOrderId } });
      if (os) {
        if (anyInProgress && os.status === 'WAITING_PRODUCTION') {
          await tx.serviceOrder.update({
            where: { id: os.id },
            data: { status: 'IN_PRODUCTION', startedAt: os.startedAt ?? new Date() },
          });
        }
        if (allDone && os.status !== 'FINISHED') {
          await tx.serviceOrder.update({
            where: { id: os.id },
            data: { status: 'FINISHED', finishedAt: new Date() },
          });
        }
      }
      return updated;
    });
  }

  async removeStage(id: string) {
    const stage = await this.prisma.productionStage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('Etapa não encontrada');
    return this.prisma.productionStage.delete({ where: { id } });
  }
}
