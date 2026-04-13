import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
export declare class ProductsService {
    private readonly productRepo;
    constructor(productRepo: Repository<Product>);
    findAll(): Promise<Product[]>;
    findOne(id: string): Promise<Product>;
    create(productData: Partial<Product>, userRole: string): Promise<Product>;
    update(id: string, productData: Partial<Product>, userRole: string): Promise<Product>;
    remove(id: string, userRole: string): Promise<void>;
}
