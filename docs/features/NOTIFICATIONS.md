# Notifications

> Real-time admin notification system for platform events

## Overview

The Notifications feature provides real-time alerts to administrators when important events occur on the platform. Currently, it notifies admins when drivers register external rides through the public form.

Notifications appear in a dropdown accessible from the header navigation. They include metadata about the source event, allowing admins to click through to related records.

**Key Capabilities:**
- Real-time notification delivery via Firestore
- Unread count badge on notification bell
- Dropdown list with notification history
- Click-through to source records
- Mark as read functionality
- Cloud Function triggers for event detection

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  NOTIFICATIONS ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Components:                                                 │
│  │   ├─ NotificationBell (header icon with badge)              │
│  │   └─ NotificationDropdown (list of notifications)           │
│  ├─ Hook: useNotifications                                     │
│  └─ Real-time listener: onSnapshot                             │
│                                                                 │
│  Cloud Functions                                                 │
│  └─ Trigger: onExternalRideCreated                             │
│      └─ Creates notification when external ride saved          │
│                                                                 │
│  Firebase/Firestore                                             │
│  └─ Collection: notifications                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As an admin**, I see a badge when new notifications arrive so that I'm aware of activity
2. **As an admin**, I can view notification history so that I don't miss important events
3. **As an admin**, I can click a notification to view the related record
4. **As an admin**, notifications are marked as read when I view them

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/components/NotificationBell/NotificationBell.tsx` | Header bell icon |
| `web/src/components/NotificationDropdown/NotificationDropdown.tsx` | Dropdown list |
| `web/src/hooks/useNotifications.ts` | Notification data hook |

### Cloud Functions

| File | Purpose |
|------|---------|
| `web/functions/src/triggers/onExternalRideCreated.ts` | Ride notification trigger |
| `web/functions/src/services/notificationService.ts` | Notification creation logic |

## Data Model

### Firestore Collection: `notifications`

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;                   // Spanish title
  message: string;                 // Spanish description
  source_collection: string;       // e.g., "driver_rides"
  source_document_id: string;      // Document ID to link to
  metadata?: Record<string, any>;  // Additional context
  is_read: boolean;
  created_at: Timestamp;
  read_at?: Timestamp;
}

type NotificationType = 'external_driver_ride' | 'system' | 'alert';
```

## Notification Types

| Type | Trigger | Title Example |
|------|---------|---------------|
| `external_driver_ride` | Driver registers ride via public form | "Nuevo viaje registrado" |
| `system` | System alerts (future) | "Actualización del sistema" |
| `alert` | Important warnings (future) | "Atención requerida" |

## Cloud Function Trigger

```typescript
export const onExternalRideCreated = onDocumentCreated(
  'drivers/{driverId}/driver_rides/{rideId}',
  async (event) => {
    const ride = event.data?.data();
    const driverId = event.params.driverId;

    // Only process external rides
    if (ride?.category !== 'external') {
      return;
    }

    // Get driver info
    const driverDoc = await getDoc(doc(db, 'drivers', driverId));
    const driverName = driverDoc.data()?.name || 'Conductor';

    // Create notification
    await addDoc(collection(db, 'notifications'), {
      type: 'external_driver_ride',
      title: 'Nuevo viaje registrado',
      message: `${driverName} registró un viaje a ${ride.destination_address}`,
      source_collection: 'driver_rides',
      source_document_id: event.params.rideId,
      metadata: {
        driver_id: driverId,
        driver_name: driverName,
        amount: ride.tarifa,
      },
      is_read: false,
      created_at: FieldValue.serverTimestamp(),
    });
  }
);
```

## Frontend Implementation

### Real-time Listener

```typescript
function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    });

    return () => unsubscribe();
  }, []);

  return { notifications, unreadCount, markAsRead };
}
```

### Notification Bell

```tsx
function NotificationBell() {
  const { unreadCount, notifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell">
      <button onClick={() => setIsOpen(!isOpen)}>
        <BellIcon />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
      {isOpen && <NotificationDropdown notifications={notifications} />}
    </div>
  );
}
```

## Common Issues and Solutions

### Issue: Notifications not appearing

**Symptoms:** External rides saved but no notification created

**Root Cause:** Cloud Function not deployed or trigger condition not met

**Solution:** Check function logs:
```bash
firebase functions:log --only onExternalRideCreated
```

### Issue: Duplicate notifications

**Symptoms:** Same event creates multiple notifications

**Root Cause:** Cloud Function retrying on partial failure

**Solution:** Add idempotency check:
```typescript
const existingNotif = await getDocs(query(
  collection(db, 'notifications'),
  where('source_document_id', '==', rideId),
  where('type', '==', 'external_driver_ride')
));

if (!existingNotif.empty) {
  return; // Already notified
}
```

### Issue: Badge count wrong

**Symptoms:** Badge shows 0 but notifications exist

**Root Cause:** `is_read` field missing or query filter issue

**Solution:** Ensure unread filter works:
```typescript
const unreadCount = notifications.filter(n => n.is_read === false).length;
```

## Security Rules

```javascript
match /notifications/{notificationId} {
  // Only admins can read/write notifications
  allow read, write: if isAdmin();
}
```

## Related Documentation

- [External Rides](./EXTERNAL_RIDES.md) - Primary trigger source
- [Authentication](./AUTHENTICATION.md) - Admin role verification

---

**Last Updated**: January 2025
