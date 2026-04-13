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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("./entities/cart.entity");
let CartService = class CartService {
    cartRepo;
    constructor(cartRepo) {
        this.cartRepo = cartRepo;
    }
    async findAll(userId) {
        const query = `
      SELECT c.*, p.name, p.price, p.image, p.category
      FROM cart c
      JOIN products p ON c."productId" = p.id
      WHERE c."userId" = $1
      ORDER BY c."createdAt" DESC
    `;
        return this.cartRepo.query(query, [userId]);
    }
    async addToCart(userId, productId, quantity = 1) {
        const existing = await this.cartRepo.query('SELECT * FROM cart WHERE "userId" = $1 AND "productId" = $2', [userId, productId]);
        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;
            const result = await this.cartRepo.query('UPDATE cart SET quantity = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *', [newQuantity, existing[0].id]);
            return result[0];
        }
        else {
            const query = `
        INSERT INTO cart (id, "userId", "productId", quantity, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
            const result = await this.cartRepo.query(query, [
                userId,
                productId,
                quantity,
            ]);
            return result[0];
        }
    }
    async updateQuantity(userId, productId, quantity) {
        if (quantity <= 0) {
            await this.removeFromCart(userId, productId);
            throw new common_1.NotFoundException('Item removed from cart');
        }
        const result = await this.cartRepo.query('UPDATE cart SET quantity = $1, "updatedAt" = NOW() WHERE "userId" = $2 AND "productId" = $3 RETURNING *', [quantity, userId, productId]);
        if (result.length === 0)
            throw new common_1.NotFoundException('Item not found in cart');
        return result[0];
    }
    async removeFromCart(userId, productId) {
        const result = await this.cartRepo.query('DELETE FROM cart WHERE "userId" = $1 AND "productId" = $2 RETURNING *', [userId, productId]);
        if (result.length === 0)
            throw new common_1.NotFoundException('Item not found in cart');
    }
    async clearCart(userId) {
        await this.cartRepo.query('DELETE FROM cart WHERE "userId" = $1', [userId]);
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.CartItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CartService);
//# sourceMappingURL=cart.service.js.map