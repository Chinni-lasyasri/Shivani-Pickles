import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddActiveStatus1734620000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
