/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.cartService.findAll(req.user.sub);
  }

  @Post('add')
  addToCart(
    @Body() body: { productId: string; quantity?: number },
    @Request() req: any,
  ) {
    return this.cartService.addToCart(
      req.user.sub,
      body.productId,
      body.quantity || 1,
    );
  }

  @Put('update')
  updateQuantity(
    @Body() body: { productId: string; quantity: number },
    @Request() req: any,
  ) {
    return this.cartService.updateQuantity(
      req.user.sub,
      body.productId,
      body.quantity,
    );
  }

  @Delete('remove')
  removeFromCart(@Body() body: { productId: string }, @Request() req: any) {
    return this.cartService.removeFromCart(req.user.sub, body.productId);
  }

  @Delete('clear')
  clearCart(@Request() req: any) {
    return this.cartService.clearCart(req.user.sub);
  }
}
