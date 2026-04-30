import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.employee.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const e = await this.prisma.employee.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Funcionário não encontrado');
    return e;
  }

  async create(dto: CreateEmployeeDto) {
    const employee = await this.prisma.employee.create({ data: dto });
    if (employee.salary && employee.salaryPayDay) {
      await this.upsertSalaryPayable(employee.id, employee.name, Number(employee.salary), employee.salaryPayDay);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    const updated = await this.prisma.employee.update({ where: { id }, data: dto });
    const salary = updated.salary ? Number(updated.salary) : null;
    if (salary && updated.salaryPayDay) {
      await this.upsertSalaryPayable(id, updated.name, salary, updated.salaryPayDay);
    } else {
      await this.cancelSalaryPayable(id);
    }
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.cancelSalaryPayable(id);
    return this.prisma.employee.delete({ where: { id } });
  }

  private nextPayDate(day: number): Date {
    const now = new Date();
    const candidate = new Date(now.getFullYear(), now.getMonth(), day);
    if (candidate <= now) candidate.setMonth(candidate.getMonth() + 1);
    return candidate;
  }

  private async upsertSalaryPayable(employeeId: string, name: string, salary: number, payDay: number) {
    const existing = await this.prisma.payable.findFirst({
      where: { employeeId, status: { notIn: ['PAID', 'CANCELED'] } },
    });
    const dueDate = this.nextPayDate(payDay);
    if (existing) {
      await this.prisma.payable.update({
        where: { id: existing.id },
        data: { expectedAmount: salary, dueDate, description: `Salário — ${name}` },
      });
    } else {
      await this.prisma.payable.create({
        data: {
          employeeId,
          description: `Salário — ${name}`,
          category: 'Folha de Pagamento',
          dueDate,
          expectedAmount: salary,
          recurring: true,
          recurringFrequency: 'MONTHLY',
        },
      });
    }
  }

  private async cancelSalaryPayable(employeeId: string) {
    const existing = await this.prisma.payable.findFirst({
      where: { employeeId, status: { notIn: ['PAID', 'CANCELED'] } },
    });
    if (existing) {
      await this.prisma.payable.update({
        where: { id: existing.id },
        data: { status: 'CANCELED' },
      });
    }
  }
}
