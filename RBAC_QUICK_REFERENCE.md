# Quick Reference: Using Admin RBAC in Your Modules

## Step 1: Import AuthModule

In your module file:

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

## Step 2: Use Roles Decorator in Controller

```typescript
import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { YourService } from './your.service';

@Controller('your-route')
export class YourController {
  constructor(private readonly yourService: YourService) {}

  // Admin-only endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: any) {
    return this.yourService.create(dto);
  }

  // Multiple roles allowed
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @Post('bulk')
  bulkCreate(@Body() dto: any) {
    return this.yourService.bulkCreate(dto);
  }

  // Any authenticated user
  @UseGuards(JwtAuthGuard)
  @Get()
  getAll() {
    return this.yourService.getAll();
  }

  // Public endpoint
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.yourService.getOne(id);
  }
}
```

## Step 3: Easy Service Implementation

Service methods no longer need role parameters:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class YourService {
  constructor(
    @InjectRepository(YourEntity)
    private readonly repo: Repository<YourEntity>,
  ) {}

  async create(data: any) {
    // Role check is done by RolesGuard, no need to check here
    return this.repo.save(data);
  }

  async getAll() {
    return this.repo.find();
  }

  async getOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }
}
```

## Common Role Patterns

### Admin Only
```typescript
@Roles('admin')
@Post()
adminOnlyEndpoint() {}
```

### Multiple Roles
```typescript
@Roles('admin', 'moderator', 'editor')
@Post()
multiRoleEndpoint() {}
```

### Authenticated (any role)
```typescript
@UseGuards(JwtAuthGuard)
@Post()
authenticatedEndpoint() {}
```

### Public
```typescript
@Get()
publicEndpoint() {}
```

## Testing Your Protected Endpoint

### cURL
```bash
# With admin token
curl -X POST http://localhost:3000/your-route \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'

# With non-admin token (will fail)
curl -X POST http://localhost:3000/your-route \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
# Returns: 403 Forbidden - "User role 'user' does not have access"
```

### TypeScript/JavaScript
```typescript
// With admin token
const response = await fetch('http://localhost:3000/your-route', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ field: 'value' })
});

const data = await response.json();
if (response.ok) {
  console.log('Success:', data);
} else {
  console.log('Error:', data.message); // "User role 'user' does not have access"
}
```

## How It Works Under the Hood

1. **JwtAuthGuard**: Validates JWT and extracts user info
2. **RolesGuard**: Checks if user's role matches allowed roles
3. **@Roles decorator**: Provides metadata about required roles
4. **Reflector**: NestJS service that reads metadata

```
Request
  ↓
JwtAuthGuard (validates token, attaches user to request)
  ↓
RolesGuard (reads @Roles metadata, checks user.role)
  ↓
Controller Handler
  ↓
Service Method
```

## Troubleshooting

### Issue: "Cannot find module 'roles.decorator'"
**Solution**: Make sure you're importing from the correct path:
```typescript
import { Roles } from '../auth/decorators/roles.decorator';
```

### Issue: "Roles guard not working"
**Solution**: Ensure you have BOTH guards in correct order:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)  // Important: JwtAuthGuard first
```

### Issue: "User not found in request"
**Solution**: Make sure JwtAuthGuard runs first and token is valid

### Issue: Getting 403 but user should be admin
**Solution**: Verify user's role in database:
```sql
SELECT id, mobile, role FROM users WHERE id = '<user_id>';
```
Then update if needed:
```sql
UPDATE users SET role = 'admin' WHERE id = '<user_id>';
```

## Examples by Use Case

### Orders Module
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':orderId')
cancelOrder(@Param('orderId') orderId: string) {
  return this.ordersService.cancel(orderId);
}
```

### Users Module
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Patch(':userId/role')
updateUserRole(@Param('userId') userId: string, @Body() dto: any) {
  return this.usersService.updateRole(userId, dto);
}
```

### Reports Module
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'analytics')
@Get('sales')
getSalesReport() {
  return this.reportsService.getSalesReport();
}
```

## Next Steps

1. Apply this pattern to other admin operations
2. Consider adding more roles as needed
3. Implement audit logging for admin actions
4. Add admin dashboard/management endpoints
