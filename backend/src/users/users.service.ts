import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

const SELECT = { id: true, name: true, email: true, role: true, active: true, createdAt: true };

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ select: SELECT, orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, select: SELECT });
    if (!u) throw new NotFoundException('Usuário não encontrado');
    return u;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hash, role: dto.role ?? 'USER' },
      select: SELECT,
    });
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.name     !== undefined) data.name   = dto.name;
    if (dto.email    !== undefined) data.email  = dto.email;
    if (dto.role     !== undefined) data.role   = dto.role;
    if (dto.active   !== undefined) data.active = dto.active;
    if (dto.password)               data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({ where: { id }, data, select: SELECT });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
