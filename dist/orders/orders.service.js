"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
let OrdersService = class OrdersService {
    orderRepo;
    constructor(orderRepo) {
        this.orderRepo = orderRepo;
    }
    async create(userId, dto) {
        console.log('userId', userId);
        console.log('dto', dto);
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Order must contain at least one item');
        }
        const totalPrice = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const query = `
      INSERT INTO orders (id, "userId", items, "totalPrice", status, "paymentMethod", "paymentDone", 
                         "shippingAddress", notes, active, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, 'pending', $4, $5, $6, $7, 1, NOW(), NOW())
      RETURNING *
    `;
        const result = await this.orderRepo.query(query, [
            userId,
            JSON.stringify(dto.items),
            totalPrice,
            dto.paymentMethod || null,
            dto.paymentDone || false,
            JSON.stringify(dto.shippingAddress || {}),
            dto.notes || null,
        ]);
        return result[0];
    }
    async findAll(userRole, userId) {
        if (userRole !== 'admin' && !userId) {
            throw new common_1.ForbiddenException('Only admins can view all orders');
        }
        let query;
        const params = [];
        if (userRole === 'admin') {
            query = 'SELECT * FROM orders ORDER BY "createdAt" DESC';
        }
        else {
            query =
                'SELECT * FROM orders WHERE active = 1 AND "userId" = $1 ORDER BY "createdAt" DESC';
            params.push(userId);
        }
        console.log('query:', query);
        const orders = await this.orderRepo.query(query, params);
        console.log('Fetched orders:', orders);
        return orders;
    }
    async findOne(id, userRole, userId) {
        const query = 'SELECT * FROM orders WHERE id = $1 AND active = 1';
        const orders = await this.orderRepo.query(query, [id]);
        if (orders.length === 0) {
            throw new common_1.NotFoundException('Order not found');
        }
        const order = orders[0];
        if (userRole !== 'admin' && order.userId !== userId) {
            throw new common_1.ForbiddenException('You can only view your own orders');
        }
        return order;
    }
    async updateStatus(id, status, userRole, userId) {
        const validStatuses = [
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled',
        ];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        const orderQuery = 'SELECT * FROM orders WHERE id = $1 AND active = 1';
        const orders = await this.orderRepo.query(orderQuery, [id]);
        if (orders.length === 0) {
            throw new common_1.NotFoundException('Order not found');
        }
        const order = orders[0];
        if (userRole === 'admin') {
        }
        else if (userRole === 'user') {
            if (order.userId !== userId) {
                throw new common_1.ForbiddenException('You can only update your own orders');
            }
            if (status !== 'cancelled') {
                throw new common_1.ForbiddenException('Users can only cancel orders');
            }
            if (order.status !== 'pending') {
                throw new common_1.BadRequestException('Order cannot be cancelled. It may already be shipped or delivered.');
            }
        }
        else {
            throw new common_1.ForbiddenException('Insufficient permissions to update order status');
        }
        const updateQuery = `
      UPDATE orders
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `;
        const result = await this.orderRepo.query(updateQuery, [status, id]);
        return result[0];
    }
    async cancel(id, userId) {
        const query = `
      UPDATE orders
      SET status = 'cancelled', active = 2, "updatedAt" = NOW()
      WHERE id = $1 AND "userId" = $2 AND status = 'pending' AND active = 1
      RETURNING *
    `;
        const result = await this.orderRepo.query(query, [id, userId]);
        if (result.length === 0) {
            throw new common_1.BadRequestException('Order cannot be cancelled. It may already be shipped or not exist.');
        }
        return result[0];
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map