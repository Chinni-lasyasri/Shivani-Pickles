import { IsIn, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    message: 'Status must be one of: pending, confirmed, shipped, delivered, cancelled'
  })
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}