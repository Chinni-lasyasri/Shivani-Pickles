# Order Status Update - Quick Reference

## 🎯 Feature: Role-Based Order Status Updates

Both **admins** and **users** can now update order statuses with appropriate permissions.

## 📋 Permission Matrix

| Action | Admin | User |
|--------|-------|------|
| View all orders | ✅ | ❌ (own only) |
| Update any order status | ✅ | ❌ |
| Cancel own pending order | ✅ | ✅ |
| Change status to confirmed/shipped/delivered | ✅ | ❌ |

## 🚀 API Usage

### Update Order Status
```http
PATCH /api/orders/{orderId}/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "cancelled"
}
```

### Valid Status Values
- `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

## 💡 Examples

### Admin: Update Order to Shipped
```bash
curl -X PATCH http://localhost:3000/api/orders/123/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

### User: Cancel Own Order
```bash
curl -X PATCH http://localhost:3000/api/orders/123/status \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

## ⚠️ Error Cases

### User tries to ship order
```json
{
  "statusCode": 403,
  "message": "Users can only cancel orders"
}
```

### User tries to update another user's order
```json
{
  "statusCode": 403,
  "message": "You can only update your own orders"
}
```

### User tries to cancel shipped order
```json
{
  "statusCode": 400,
  "message": "Order cannot be cancelled. It may already be shipped or delivered."
}
```

## 🔧 Implementation Pattern

### Controller
```typescript
@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
async updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdateOrderStatusDto,
  @Request() req: any,
) {
  const userId = req.user.sub;
  const userRole = req.user.role;
  return this.service.updateStatus(id, dto.status, userRole, userId);
}
```

### Service Logic
```typescript
async updateStatus(id: string, status: string, userRole: string, userId?: string) {
  // 1. Validate status
  // 2. Get order
  // 3. Check permissions (admin vs user)
  // 4. Update if allowed
}
```

## 📁 Files Modified

- ✅ `src/orders/dto/update-order-status.dto.ts` (new)
- ✅ `src/orders/orders.controller.ts` (updated)
- ✅ `src/orders/orders.service.ts` (updated)
- ✅ `src/orders/orders.module.ts` (updated)

## 🧪 Testing Checklist

- [ ] Admin can update any order to any status
- [ ] User can cancel own pending order
- [ ] User cannot update other user's orders
- [ ] User cannot change status to non-cancelled
- [ ] User cannot cancel non-pending orders
- [ ] Invalid status values are rejected
- [ ] Non-existent orders return 404

## 🔗 Related Features

- [RBAC for Products](RBAC_QUICK_REFERENCE.md)
- [Order Management](ORDER_STATUS_UPDATE_FEATURE.md)

---

**Ready to use!** See [ORDER_STATUS_UPDATE_FEATURE.md](ORDER_STATUS_UPDATE_FEATURE.md) for complete documentation.
