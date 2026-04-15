/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.sub;
    // console.log('123:', req);
    console.log('456', createOrderDto);
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    return this.ordersService.findAll(userRole, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    return this.ordersService.findOne(id, userRole, userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    return this.ordersService.updateStatus(
      id,
      updateOrderStatusDto.status,
      userRole,
      userId,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.ordersService.cancel(id, userId);
  }
}
