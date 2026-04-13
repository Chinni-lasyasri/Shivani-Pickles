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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
let ProductsService = class ProductsService {
    productRepo;
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async findAll() {
        const products = await this.productRepo.query('SELECT * FROM products ORDER BY "createdAt" DESC');
        return products;
    }
    async findOne(id) {
        const products = await this.productRepo.query('SELECT * FROM products WHERE id = $1', [id]);
        if (products.length === 0)
            throw new common_1.NotFoundException('Product not found');
        return products[0];
    }
    async create(productData, userRole) {
        if (userRole !== 'admin')
            throw new common_1.ForbiddenException('Only admins can add products');
        const query = `
      INSERT INTO products (id, name, category, description, price, "oldPrice", image, badge, rating, reviews, tags, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;
        const values = [
            productData.name,
            productData.category,
            productData.description,
            productData.price,
            productData.oldPrice,
            productData.image,
            productData.badge,
            productData.rating || 5,
            productData.reviews || 0,
            productData.tags || [],
        ];
        const result = await this.productRepo.query(query, values);
        return result[0];
    }
    async update(id, productData, userRole) {
        if (userRole !== 'admin')
            throw new common_1.ForbiddenException('Only admins can update products');
        const setParts = [];
        const values = [];
        let paramIndex = 1;
        if (productData.name) {
            setParts.push(`name = $${paramIndex++}`);
            values.push(productData.name);
        }
        if (productData.category) {
            setParts.push(`category = $${paramIndex++}`);
            values.push(productData.category);
        }
        if (productData.description) {
            setParts.push(`description = $${paramIndex++}`);
            values.push(productData.description);
        }
        if (productData.price !== undefined) {
            setParts.push(`price = $${paramIndex++}`);
            values.push(productData.price);
        }
        if (productData.oldPrice !== undefined) {
            setParts.push(`"oldPrice" = $${paramIndex++}`);
            values.push(productData.oldPrice);
        }
        if (productData.image) {
            setParts.push(`image = $${paramIndex++}`);
            values.push(productData.image);
        }
        if (productData.badge !== undefined) {
            setParts.push(`badge = $${paramIndex++}`);
            values.push(productData.badge);
        }
        if (productData.rating !== undefined) {
            setParts.push(`rating = $${paramIndex++}`);
            values.push(productData.rating);
        }
        if (productData.reviews !== undefined) {
            setParts.push(`reviews = $${paramIndex++}`);
            values.push(productData.reviews);
        }
        if (productData.tags) {
            setParts.push(`tags = $${paramIndex++}`);
            values.push(productData.tags);
        }
        if (setParts.length === 0)
            throw new common_1.NotFoundException('No fields to update');
        const query = `
      UPDATE products
      SET ${setParts.join(', ')}, "updatedAt" = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        values.push(id);
        const result = await this.productRepo.query(query, values);
        if (result.length === 0)
            throw new common_1.NotFoundException('Product not found');
        return result[0];
    }
    async remove(id, userRole) {
        if (userRole !== 'admin')
            throw new common_1.ForbiddenException('Only admins can delete products');
        const result = await this.productRepo.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.length === 0)
            throw new common_1.NotFoundException('Product not found');
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map