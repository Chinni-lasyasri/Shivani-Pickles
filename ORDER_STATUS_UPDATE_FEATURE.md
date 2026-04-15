# Order Status Update - Role-Based Access Control

## Overview

This feature implements comprehensive order status management with role-based access control, allowing both admins and users to update order statuses with appropriate permissions.

## Architecture

### Components

1. **UpdateOrderStatusDto** (`src/orders/dto/update-order-status.dto.ts`)
   - Validates status updates with class-validator
   - Ensures only valid status values are accepted

2. **OrdersController** (`src/orders/orders.controller.ts`)
   - Uses `@Roles('admin', 'user')` to allow both roles
   - Protected with `JwtAuthGuard` and `RolesGuard`

3. **OrdersService** (`src/orders/orders.service.ts`)
   - Implements business logic for status updates
   - Enforces role-based permissions

## Order Status Flow

```
pending → confirmed → shipped → delivered
    ↓
cancelled (by user or admin)
```

## Permission Matrix

| Role  | Can View | Can Update Status | Status Restrictions |
|-------|----------|-------------------|-------------------|
| **admin** | All orders | Any order, any status | None |
| **user** | Own orders only | Own orders only | Can only cancel pending orders |

## API Endpoints

### Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "cancelled"
}
```

**Valid Status Values:**
- `pending` (admin only)
- `confirmed` (admin only)
- `shipped` (admin only)
- `delivered` (admin only)
- `cancelled` (admin or user)

## Usage Examples

### Admin Updating Order Status

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/orders/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

**Response (Success 200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid",
  "items": [...],
  "totalPrice": 299.99,
  "status": "shipped",
  "paymentMethod": "card",
  "paymentDone": true,
  "shippingAddress": {...},
  "notes": null,
  "createdAt": "2026-04-15T10:00:00Z",
  "updatedAt": "2026-04-15T11:30:00Z"
}
```

### User Cancelling Their Order

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/orders/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

**Response (Success 200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid",
  "status": "cancelled",
  "updatedAt": "2026-04-15T11:45:00Z",
  ...
}
```

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
  "message": "User role 'user' does not have access. Required roles: admin, user",
  "error": "Forbidden"
}
```

### User Trying to Update Another User's Order
```json
{
  "statusCode": 403,
  "message": "You can only update your own orders",
  "error": "Forbidden"
}
```

### User Trying to Change Status to Non-Cancelled
```json
{
  "statusCode": 403,
  "message": "Users can only cancel orders",
  "error": "Forbidden"
}
```

### User Trying to Cancel Non-Pending Order
```json
{
  "statusCode": 400,
  "message": "Order cannot be cancelled. It may already be shipped or delivered.",
  "error": "Bad Request"
}
```

### Invalid Status Value
```json
{
  "statusCode": 400,
  "message": "status must be one of: pending, confirmed, shipped, delivered, cancelled",
  "error": "Bad Request"
}
```

### Order Not Found
```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

## Business Rules

### Admin Permissions
- ✅ Can update any order to any valid status
- ✅ Can view all orders
- ✅ Can cancel orders at any stage

### User Permissions
- ✅ Can only update their own orders
- ✅ Can only change status to `cancelled`
- ✅ Can only cancel orders with `pending` status
- ✅ Can view only their own orders

### Status Transition Rules
- **Pending → Confirmed**: Admin only
- **Confirmed → Shipped**: Admin only
- **Shipped → Delivered**: Admin only
- **Any Status → Cancelled**: Admin (any time) or User (only if pending)

## Implementation Details

### Controller Implementation
```typescript
@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
async updateStatus(
  @Param('id') id: string,
  @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  @Request() req: any,
) {
  const userId = req.user.sub;
  const userRole = req.user.role;
  return this.ordersService.updateStatus(id, updateOrderStatusDto.status, userRole, userId);
}
```

### Service Logic Flow
```
1. Validate status value
2. Fetch order from database
3. Check user permissions:
   - Admin: Allow all updates
   - User: Check ownership + status restrictions
4. Update order status
5. Return updated order
```

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  items JSONB,
  totalPrice DECIMAL(10,2),
  status VARCHAR DEFAULT 'pending',
  paymentMethod VARCHAR,
  paymentDone BOOLEAN DEFAULT FALSE,
  shippingAddress JSONB,
  notes VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

## Testing

### Admin Tests
```typescript
// Admin can update any order to any status
PATCH /api/orders/{orderId}/status
Body: { "status": "confirmed" } // ✅ Success
Body: { "status": "shipped" }   // ✅ Success
Body: { "status": "cancelled" } // ✅ Success
```

### User Tests
```typescript
// User can only cancel their own pending orders
PATCH /api/orders/{ownOrderId}/status
Body: { "status": "cancelled" } // ✅ Success (if pending)

PATCH /api/orders/{ownOrderId}/status
Body: { "status": "confirmed" } // ❌ Forbidden

PATCH /api/orders/{otherUserOrderId}/status
Body: { "status": "cancelled" } // ❌ Forbidden
```

## Security Considerations

1. **JWT Validation**: All requests require valid JWT tokens
2. **Role Verification**: Guards enforce role-based access
3. **Ownership Check**: Users can only modify their own orders
4. **Status Validation**: Prevents invalid status transitions
5. **Input Validation**: DTO ensures only valid status values

## Future Enhancements

- Add order status history/audit trail
- Implement order status change notifications
- Add bulk status updates for admins
- Implement automatic status transitions (e.g., auto-deliver after X days)
- Add order status change reasons/comments

## Related Files

- [src/orders/dto/update-order-status.dto.ts](src/orders/dto/update-order-status.dto.ts)
- [src/orders/orders.controller.ts](src/orders/orders.controller.ts)
- [src/orders/orders.service.ts](src/orders/orders.service.ts)
- [src/orders/orders.module.ts](src/orders/orders.module.ts)
- [src/auth/guards/roles.guard.ts](src/auth/guards/roles.guard.ts)
- [src/auth/decorators/roles.decorator.ts](src/auth/decorators/roles.decorator.ts)
