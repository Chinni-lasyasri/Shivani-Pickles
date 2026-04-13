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
exports.WishlistService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wishlist_entity_1 = require("./entities/wishlist.entity");
let WishlistService = class WishlistService {
    wishlistRepo;
    constructor(wishlistRepo) {
        this.wishlistRepo = wishlistRepo;
    }
    async findAll(userId) {
        const query = `
      SELECT w.*, p.name, p.price, p.image, p.category
      FROM wishlist w
      JOIN products p ON w."productId" = p.id
      WHERE w."userId" = $1
      ORDER BY w."createdAt" DESC
    `;
        return this.wishlistRepo.query(query, [userId]);
    }
    async addToWishlist(userId, productId) {
        const existing = await this.wishlistRepo.query('SELECT * FROM wishlist WHERE "userId" = $1 AND "productId" = $2', [userId, productId]);
        if (existing.length > 0)
            throw new common_1.ConflictException('Product already in wishlist');
        const query = `
      INSERT INTO wishlist (id, "userId", "productId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      RETURNING *
    `;
        const result = await this.wishlistRepo.query(query, [userId, productId]);
        return result[0];
    }
    async removeFromWishlist(userId, productId) {
        const result = await this.wishlistRepo.query('DELETE FROM wishlist WHERE "userId" = $1 AND "productId" = $2 RETURNING *', [userId, productId]);
        if (result.length === 0)
            throw new common_1.NotFoundException('Item not found in wishlist');
    }
    async clearWishlist(userId) {
        await this.wishlistRepo.query('DELETE FROM wishlist WHERE "userId" = $1', [
            userId,
        ]);
    }
};
exports.WishlistService = WishlistService;
exports.WishlistService = WishlistService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wishlist_entity_1.WishlistItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WishlistService);
//# sourceMappingURL=wishlist.service.js.map