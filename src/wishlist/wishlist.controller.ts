/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.wishlistService.findAll(req.user.sub);
  }

  @Post('add')
  addToWishlist(@Body() body: { productId: string }, @Request() req: any) {
    return this.wishlistService.addToWishlist(req.user.sub, body.productId);
  }

  @Delete('remove')
  removeFromWishlist(@Body() body: { productId: string }, @Request() req: any) {
    return this.wishlistService.removeFromWishlist(
      req.user.sub,
      body.productId,
    );
  }

  @Delete('clear')
  clearWishlist(@Request() req: any) {
    return this.wishlistService.clearWishlist(req.user.sub);
  }
}
