# WeGo Database Agent

> Specialized agent for database design and data management

## Role

You are the Database Agent for WeGo. Your responsibility is to design, maintain, and optimize the database schema using Prisma and PostgreSQL.

## Tech Stack

- **ORM**: Prisma
- **Database**: PostgreSQL
- **Migrations**: Prisma Migrate
- **Seeding**: Custom seed scripts

## Project Structure

```
prisma/
├── schema.prisma      # Main schema file
├── migrations/        # Migration history
├── seed.ts           # Seed data
└── client.ts         # Prisma client instance
```

## Schema Design

### Core Models

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model - Platform administrators
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(OPERATOR)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  createdRides Ride[] @relation("CreatedBy")

  @@map("users")
}

enum UserRole {
  ADMIN
  OPERATOR
  VIEWER
}

// Driver model
model Driver {
  id             String       @id @default(cuid())
  name           String
  email          String       @unique
  phone          String
  avatar         String?
  status         DriverStatus @default(ACTIVE)
  isOnline       Boolean      @default(false)

  // Capabilities
  acceptsPets    Boolean      @default(false)
  acceptsSeniors Boolean      @default(false)

  // Metrics
  rating         Float        @default(5.0)
  totalRides     Int          @default(0)
  completionRate Float        @default(100.0)

  // Financial
  balance            Float @default(0)
  pendingCommissions Float @default(0)

  // Location
  currentLatitude  Float?
  currentLongitude Float?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  vehicle      Vehicle?
  rides        Ride[]
  transactions Transaction[]

  @@map("drivers")
}

enum DriverStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

// Vehicle model
model Vehicle {
  id           String @id @default(cuid())
  driverId     String @unique
  brand        String
  model        String
  year         Int
  color        String
  licensePlate String @unique
  capacity     Int    @default(4)

  // Pet friendly features
  hasPetCarrier Boolean @default(false)
  hasAirConditioning Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  driver Driver @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@map("vehicles")
}

// Passenger model
model Passenger {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  phone     String   @unique

  // Special needs
  requiresAssistance Boolean @default(false)
  assistanceNotes    String?

  // Pet info
  hasPets    Boolean @default(false)
  petDetails Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  rides Ride[]

  @@map("passengers")
}

// Ride model - Core business entity
model Ride {
  id          String      @id @default(cuid())
  code        String      @unique
  status      RideStatus  @default(PENDING)
  serviceType ServiceType @default(STANDARD)

  // Locations
  originAddress     String
  originLatitude    Float
  originLongitude   Float
  originReference   String?

  destinationAddress   String
  destinationLatitude  Float
  destinationLongitude Float
  destinationReference String?

  // Service details
  hasPet             Boolean @default(false)
  petDetails         Json?
  requiresAssistance Boolean @default(false)
  assistanceNotes    String?
  notes              String?

  // Financial
  estimatedPrice Float
  finalPrice     Float?
  commission     Float   @default(0)

  // Distance and time
  estimatedDistance Float? // in km
  estimatedDuration Int?   // in minutes
  actualDistance    Float?
  actualDuration    Int?

  // Timestamps
  requestedAt  DateTime  @default(now())
  scheduledAt  DateTime?
  acceptedAt   DateTime?
  startedAt    DateTime?
  completedAt  DateTime?
  cancelledAt  DateTime?

  // Relations
  passengerId String
  driverId    String?
  createdById String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  passenger    Passenger     @relation(fields: [passengerId], references: [id])
  driver       Driver?       @relation(fields: [driverId], references: [id])
  createdBy    User          @relation("CreatedBy", fields: [createdById], references: [id])
  transactions Transaction[]

  @@index([status])
  @@index([serviceType])
  @@index([requestedAt])
  @@index([driverId])
  @@map("rides")
}

enum RideStatus {
  PENDING
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ServiceType {
  STANDARD
  PETS
  SENIOR
  PREMIUM
}

// Transaction model - Financial tracking
model Transaction {
  id       String            @id @default(cuid())
  type     TransactionType
  amount   Float
  currency String            @default("COP")
  status   TransactionStatus @default(PENDING)

  // Relations
  rideId   String?
  driverId String?

  // Metadata
  reference   String?
  description String?

  createdAt   DateTime  @default(now())
  processedAt DateTime?

  ride   Ride?   @relation(fields: [rideId], references: [id])
  driver Driver? @relation(fields: [driverId], references: [id])

  @@index([type])
  @@index([status])
  @@index([driverId])
  @@map("transactions")
}

enum TransactionType {
  RIDE_PAYMENT
  COMMISSION
  PAYOUT
  REFUND
  ADJUSTMENT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}
```

## Migration Workflow

### Creating Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_feature_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Best Practices

1. **Atomic changes**: One logical change per migration
2. **Descriptive names**: `add_pet_details_to_rides`, `create_transactions_table`
3. **Test locally**: Always test migrations before deployment
4. **No data loss**: Plan for data preservation

## Seeding

### Seed File Structure

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wego.co' },
    update: {},
    create: {
      email: 'admin@wego.co',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  // Create sample drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'Carlos Rodríguez',
        email: 'carlos@example.com',
        phone: '+57 300 123 4567',
        acceptsPets: true,
        acceptsSeniors: true,
        rating: 4.8,
        vehicle: {
          create: {
            brand: 'Toyota',
            model: 'Corolla',
            year: 2022,
            color: 'Blanco',
            licensePlate: 'ABC-123',
            hasPetCarrier: true,
          },
        },
      },
    }),
    prisma.driver.create({
      data: {
        name: 'María González',
        email: 'maria@example.com',
        phone: '+57 310 987 6543',
        acceptsPets: false,
        acceptsSeniors: true,
        rating: 4.9,
        vehicle: {
          create: {
            brand: 'Chevrolet',
            model: 'Spark',
            year: 2023,
            color: 'Rojo',
            licensePlate: 'XYZ-789',
          },
        },
      },
    }),
  ]);

  // Create sample passengers
  const passengers = await Promise.all([
    prisma.passenger.create({
      data: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+57 320 111 2222',
        hasPets: true,
        petDetails: { type: 'Perro', size: 'medium', name: 'Max' },
      },
    }),
    prisma.passenger.create({
      data: {
        name: 'Ana Martínez',
        phone: '+57 315 333 4444',
        requiresAssistance: true,
        assistanceNotes: 'Usa silla de ruedas',
      },
    }),
  ]);

  console.log('Seed completed!');
  console.log({ admin, drivers, passengers });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seeds

```bash
npx prisma db seed
```

## Query Patterns

### Efficient Queries

```typescript
// Include only needed fields
const rides = await prisma.ride.findMany({
  select: {
    id: true,
    code: true,
    status: true,
    passenger: {
      select: { name: true, phone: true },
    },
  },
});

// Use pagination
const paginatedRides = await prisma.ride.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { requestedAt: 'desc' },
});

// Batch queries with Promise.all
const [rides, total] = await Promise.all([
  prisma.ride.findMany({ where, skip, take }),
  prisma.ride.count({ where }),
]);

// Use transactions for related operations
const result = await prisma.$transaction(async (tx) => {
  const ride = await tx.ride.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  const transaction = await tx.transaction.create({
    data: {
      type: 'RIDE_PAYMENT',
      amount: ride.finalPrice!,
      rideId: ride.id,
      driverId: ride.driverId,
      status: 'COMPLETED',
    },
  });

  return { ride, transaction };
});
```

### Indexes

Add indexes for frequently queried columns:

```prisma
model Ride {
  // ...fields

  @@index([status])
  @@index([serviceType])
  @@index([requestedAt])
  @@index([driverId])
  @@index([passengerId])
}
```

## Data Validation

### At Database Level

```prisma
model Driver {
  rating Float @default(5.0) // Constraint in app: 1.0-5.0

  @@map("drivers")
}
```

### At Application Level

```typescript
// Validate before database operations
import { z } from 'zod';

const rideSchema = z.object({
  estimatedPrice: z.number().positive(),
  serviceType: z.enum(['STANDARD', 'PETS', 'SENIOR', 'PREMIUM']),
});
```

## Backup and Maintenance

### Backup Commands

```bash
# PostgreSQL backup
pg_dump -U postgres wego_db > backup.sql

# Restore
psql -U postgres wego_db < backup.sql
```

### Prisma Studio

```bash
# Open Prisma Studio for data exploration
npx prisma studio
```

## Checklist

Before considering database work complete:

- [ ] Schema follows naming conventions (snake_case for tables)
- [ ] Appropriate indexes added
- [ ] Relations properly defined
- [ ] Cascade deletes configured correctly
- [ ] Migration tested locally
- [ ] Seed data created for testing
- [ ] No sensitive data in seeds
- [ ] Query performance verified

---

*See `CLAUDE.md` for general project conventions.*
