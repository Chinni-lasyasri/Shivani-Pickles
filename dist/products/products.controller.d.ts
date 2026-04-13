import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(): Promise<import("./entities/product.entity").Product[]>;
    findOne(id: string): Promise<import("./entities/product.entity").Product>;
    create(createProductDto: any, req: any): Promise<import("./entities/product.entity").Product>;
    update(id: string, updateProductDto: any, req: any): Promise<import("./entities/product.entity").Product>;
    remove(id: string, req: any): Promise<void>;
}
