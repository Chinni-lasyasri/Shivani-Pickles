# Admin Role-Based Access for Product Management

## Overview

This feature implements role-based access control (RBAC) for product operations in the Pickles application. Only users with the "admin" role can create, update, or delete products.

## Architecture

### Components

1. **Roles Decorator** (`src/auth/decorators/roles.decorator.ts`)
   - Metadata decorator that specifies which roles are allowed for a route
   - Usage: `@Roles('admin')` or `@Roles('admin', 'moderator')`

2. **Roles Guard** (`src/auth/guards/roles.guard.ts`)
   - NestJS guard that enforces role-based access control
   - Works in conjunction with JwtAuthGuard
   - Throws `ForbiddenException` if user role is not authorized

3. **Products Controller** (`src/products/products.controller.ts`)
   - Routes are protected with `@UseGuards(JwtAuthGuard, RolesGuard)`
   - Admin-only routes decorated with `@Roles('admin')`

### User Roles

The system supports the following roles:
- `user` - Default role for regular users (can view products only)
- `admin` - Can create, update, and delete products

## Usage

### For Controllers

To protect a route with role-based access:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createProductDto: any) {
    // Only admins can create products
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductDto: any) {
    // Only admins can update products
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    // Only admins can delete products
  }
}
```

### For Multiple Roles

To allow multiple roles:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
@Post()
create(@Body() createProductDto: any) {
  // Both admins and moderators can create products
}
```

## API Endpoints

### Protected Product Endpoints (Admin Only)

#### Create Product
```http
POST /products
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Pickle Jar",
  "category": "Containers",
  "description": "Glass pickle jar",
  "price": 299,
  "oldPrice": 399,
  "image": "url",
  "badge": "New",
  "rating": 5,
  "reviews": 10,
  "tags": ["glass", "jar"]
}
```

**Response (Success 201):**
```json
{
  "id": "uuid",
  "name": "Pickle Jar",
  "category": "Containers",
  "description": "Glass pickle jar",
  "price": 299,
  "oldPrice": 399,
  "image": "url",
  "badge": "New",
  "rating": 5,
  "reviews": 10,
  "tags": ["glass", "jar"],
  "createdAt": "2026-04-15T10:00:00Z",
  "updatedAt": "2026-04-15T10:00:00Z"
}
```

**Response (Forbidden - Non-Admin):**
```json
{
  "statusCode": 403,
  "message": "User role 'user' does not have access. Required roles: admin",
  "error": "Forbidden"
}
```

#### Update Product
```http
PUT /products/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "price": 279,
  "oldPrice": 379
}
```

#### Delete Product
```http
DELETE /products/:id
Authorization: Bearer <JWT_TOKEN>
```

### Public Product Endpoints (No Auth Required)

#### Get All Products
```http
GET /products
```

#### Get Single Product
```http
GET /products/:id
```

## Error Responses

### Missing JWT Token
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Invalid/Expired JWT Token
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

### Insufficient Role
```json
{
  "statusCode": 403,
  "message": "User role 'user' does not have access. Required roles: admin",
  "error": "Forbidden"
}
```

## Database Considerations

### User Roles Setup

To create an admin user, you need to:

1. Register as a normal user
2. Manually update the role in the database:

```sql
UPDATE users SET role = 'admin' WHERE id = '<user_id>';
```

Or set the role during user creation in the auth service if implementing an admin setup endpoint.

## Usage in Other Modules

To use the RolesGuard and Roles decorator in other modules:

1. Import AuthModule in your module
2. Use the decorator and guard in your controller

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { YourController } from './your.controller';
import { YourService } from './your.service';

@Module({
  imports: [AuthModule],
  controllers: [YourController],
  providers: [YourService],
})
export class YourModule {}
```

## Testing

### With cURL

```bash
# Get JWT token (register/login first)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "1234567890", "password": "password"}'

# Use token to create product (as admin)
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "category": "Test",
    "price": 100
  }'
```

### With Postman

1. Set up environment variable: `{{jwt_token}}`
2. Make login request to get token
3. Use Bearer token in Authorization header for protected routes

## Security Considerations

1. **JWT Validation**: All protected routes require valid JWT tokens
2. **Role Verification**: Guards enforce role checks before route handler execution
3. **Guard Ordering**: JwtAuthGuard must be applied before RolesGuard
4. **Error Handling**: Clear error messages for authorization failures

## Future Enhancements

- Add role hierarchy (e.g., admin > moderator > user)
- Implement resource-level permissions (e.g., user can only edit their own data)
- Add audit logging for admin operations
- Implement role management endpoints for admins
- Add permission-based access control (finer-grained than roles)

## Related Files

- [src/auth/decorators/roles.decorator.ts](src/auth/decorators/roles.decorator.ts)
- [src/auth/guards/roles.guard.ts](src/auth/guards/roles.guard.ts)
- [src/products/products.controller.ts](src/products/products.controller.ts)
- [src/products/products.service.ts](src/products/products.service.ts)
- [src/auth/auth.module.ts](src/auth/auth.module.ts)
