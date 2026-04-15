# 🔐 Admin Role-Based Access Control - Architecture Overview

## File Structure

```
backend/src/
├── auth/
│   ├── decorators/
│   │   └── roles.decorator.ts          [NEW] Role metadata decorator
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           (existing) JWT validation
│   │   └── roles.guard.ts              [NEW] Role enforcement
│   ├── auth.module.ts                  [MODIFIED] Exports RolesGuard
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── ...
└── products/
    ├── products.controller.ts          [MODIFIED] Uses @Roles decorator
    ├── products.service.ts             [MODIFIED] Removed role checks
    └── products.module.ts
```

## Implementation Summary

### New Files
- ✅ `src/auth/decorators/roles.decorator.ts` - 7 lines
- ✅ `src/auth/guards/roles.guard.ts` - 43 lines

### Modified Files
- ✏️ `src/products/products.controller.ts` - Added guard and decorator imports, applied to 3 routes
- ✏️ `src/products/products.service.ts` - Removed userRole params and role checks
- ✏️ `src/auth/auth.module.ts` - Added RolesGuard to providers and exports

### Documentation Files
- 📄 `ADMIN_RBAC_FEATURE.md` - Comprehensive feature documentation
- 📄 `RBAC_QUICK_REFERENCE.md` - Developer quick reference
- 📄 `IMPLEMENTATION_SUMMARY.md` - Implementation overview

## How It Works

### Request Flow for Product Creation (Admin Only)

```
┌─────────────────────────────────────────────────────────────┐
│ Client Request                                              │
│ POST /products                                              │
│ Headers: Authorization: Bearer <JWT_TOKEN>                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ JwtAuthGuard                                                │
│ ✓ Validates JWT signature                                  │
│ ✓ Decodes token: { sub, mobile, role }                    │
│ ✓ Attaches user object to request                          │
│ → request.user = { sub, mobile, role }                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ RolesGuard                                                  │
│ ✓ Reads @Roles('admin') metadata                           │
│ ✓ Checks: request.user.role === 'admin'                   │
│ ✓ YES → Proceed to handler                                 │
│ ✗ NO → Throw ForbiddenException (403)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ ProductsController.create()                                 │
│ @Post()                                                     │
│ @Roles('admin')                                             │
│ ✓ Only executes if user is admin                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ ProductsService.create()                                    │
│ ✓ Creates product (no role checks needed)                  │
│ ✓ Returns new product                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Response to Client                                          │
│ Status: 201 Created                                         │
│ Body: { id, name, category, ... }                         │
└─────────────────────────────────────────────────────────────┘
```

## Decorator Usage

### Single Role
```typescript
@Roles('admin')                    // Only admins
@Roles('moderator')                // Only moderators
```

### Multiple Roles
```typescript
@Roles('admin', 'moderator')       // Admins OR Moderators
@Roles('admin', 'editor', 'user')  // Admins OR Editors OR Users
```

### No Role Required
```typescript
@UseGuards(JwtAuthGuard)           // Auth required, any role
// No @Roles()                     // No role restriction
```

### Public Access
```typescript
// No @UseGuards(), no @Roles()   // Completely public
```

## Current Implementation

### Routes with Role-Based Access

| Method | Route | Roles | Status |
|--------|-------|-------|--------|
| GET | `/products` | Public | ✅ |
| GET | `/products/:id` | Public | ✅ |
| POST | `/products` | `admin` | ✅ |
| PUT | `/products/:id` | `admin` | ✅ |
| DELETE | `/products/:id` | `admin` | ✅ |

### User Table Structure

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  mobile VARCHAR UNIQUE,
  password VARCHAR,
  firstName VARCHAR,
  lastName VARCHAR,
  email VARCHAR UNIQUE,
  role VARCHAR DEFAULT 'user',  -- Values: 'user', 'admin'
  ...
)
```

## Benefits

✅ **Clean Separation** - Auth logic in guards, business logic in services
✅ **Easy to Use** - Just add `@Roles('admin')`
✅ **Reusable** - Apply to any module/route
✅ **Scalable** - Easy to add more roles
✅ **Type-Safe** - Full TypeScript support
✅ **Clear Errors** - Users know exactly why access was denied
✅ **Flexible** - Single role or multiple roles
✅ **Standards-Based** - Uses NestJS best practices

## Error Responses

### Unauthorized (Missing/Invalid Token)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Forbidden (Insufficient Role)
```json
{
  "statusCode": 403,
  "message": "User role 'user' does not have access. Required roles: admin",
  "error": "Forbidden"
}
```

## Security Checklist

- [x] JWT validation before role check
- [x] Role metadata attached via decorator
- [x] Guard enforces role requirements
- [x] Clear error messages
- [x] No role checks in service layer
- [x] Proper NestJS guard implementation
- [x] Exported from auth module

## Database Setup

### Create Admin User (Manual)
```sql
-- First create user via registration
-- Then promote to admin:
UPDATE users SET role = 'admin' WHERE id = '<user_id>';

-- Verify:
SELECT id, mobile, email, role FROM users WHERE role = 'admin';
```

## Integration with Other Modules

The same pattern can be applied to any module:

```typescript
// Example: Orders Module
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':orderId/cancel')
cancelOrder(@Param('orderId') id: string) { ... }

// Example: Users Module
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Patch(':userId/role')
updateUserRole(...) { ... }
```

## Performance Considerations

- **Guards**: Executed early in request pipeline (before controller)
- **Metadata**: Cached by NestJS Reflector
- **JWT**: Validated once per request (by JwtAuthGuard)
- **Role Check**: Simple string comparison in memory

## Testing Checklist

- [ ] Admin user can create products
- [ ] Non-admin user gets 403 when creating products
- [ ] Invalid JWT returns 401
- [ ] Missing JWT returns 401
- [ ] GET /products works without auth
- [ ] Updated/deleted product operations respect admin role

---

**Ready to use!** See [ADMIN_RBAC_FEATURE.md](ADMIN_RBAC_FEATURE.md) and [RBAC_QUICK_REFERENCE.md](RBAC_QUICK_REFERENCE.md) for detailed usage.
