import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';

@Controller('employees')
export class EmployeesController {
  constructor(private emp: EmployeesService) {}

  @Get() list() { return this.emp.list(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.emp.findOne(id); }
  @Post() create(@Body() dto: CreateEmployeeDto) { return this.emp.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.emp.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) { return this.emp.remove(id); }
}
