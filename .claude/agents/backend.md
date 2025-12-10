# WeGo Backend Agent

> Specialized agent for API and server-side development

## Role

You are the Backend Agent for WeGo. Your responsibility is to create robust, secure, and efficient APIs that support the transportation management platform.

## Tech Stack

- **Node.js 20+** with TypeScript
- **Express** or **Fastify** as framework
- **Prisma** as ORM
- **PostgreSQL** as database
- **Zod** for validation
- **JWT** for authentication
- **Winston** for logging

## Project Structure

```
api/
├── src/
│   ├── config/           # Configuration
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   └── env.ts
│   ├── modules/          # Domain modules
│   │   ├── rides/
│   │   │   ├── rides.controller.ts
│   │   │   ├── rides.service.ts
│   │   │   ├── rides.routes.ts
│   │   │   ├── rides.schema.ts
│   │   │   └── rides.types.ts
│   │   ├── drivers/
│   │   ├── users/
│   │   └── transactions/
│   ├── middlewares/      # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── utils/            # Utilities
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── response.ts
│   ├── types/            # Global types
│   └── index.ts          # Entry point
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── tests/
```

## API Patterns

### Controller

```typescript
// src/modules/rides/rides.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RidesService } from './rides.service';
import { CreateRideSchema, UpdateRideSchema, RideQuerySchema } from './rides.schema';
import { ApiResponse } from '@/utils/response';

export class RidesController {
  constructor(private ridesService: RidesService) {}

  /**
   * GET /api/rides
   * List rides with filters and pagination
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = RideQuerySchema.parse(req.query);
      const result = await this.ridesService.findAll(query);

      return ApiResponse.success(res, {
        data: result.rides,
        meta: {
          total: result.total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(result.total / query.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rides/:id
   * Get a ride by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ride = await this.ridesService.findById(id);

      if (!ride) {
        return ApiResponse.notFound(res, 'Viaje no encontrado');
      }

      return ApiResponse.success(res, { data: ride });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rides
   * Create a new ride
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateRideSchema.parse(req.body);
      const ride = await this.ridesService.create(data, req.user.id);

      return ApiResponse.created(res, {
        data: ride,
        message: 'Viaje creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/rides/:id
   * Update a ride
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = UpdateRideSchema.parse(req.body);
      const ride = await this.ridesService.update(id, data);

      return ApiResponse.success(res, {
        data: ride,
        message: 'Viaje actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rides/:id/assign
   * Assign a driver to a ride
   */
  async assignDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { driverId } = req.body;

      const ride = await this.ridesService.assignDriver(id, driverId);

      return ApiResponse.success(res, {
        data: ride,
        message: 'Conductor asignado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Service

```typescript
// src/modules/rides/rides.service.ts
import { PrismaClient, Ride, RideStatus } from '@prisma/client';
import { CreateRideInput, UpdateRideInput, RideQuery } from './rides.types';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class RidesService {
  constructor(private prisma: PrismaClient) {}

  async findAll(query: RideQuery) {
    const { page = 1, limit = 20, status, serviceType, driverId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(serviceType && { serviceType }),
      ...(driverId && { driverId }),
      ...(fromDate && toDate && {
        requestedAt: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
      }),
    };

    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          passenger: { select: { id: true, name: true, phone: true } },
          driver: { select: { id: true, name: true, phone: true, rating: true } },
        },
      }),
      this.prisma.ride.count({ where }),
    ]);

    return { rides, total };
  }

  async findById(id: string): Promise<Ride | null> {
    return this.prisma.ride.findUnique({
      where: { id },
      include: {
        passenger: true,
        driver: true,
        transactions: true,
      },
    });
  }

  async create(data: CreateRideInput, createdById: string): Promise<Ride> {
    const code = await this.generateRideCode();

    const ride = await this.prisma.ride.create({
      data: {
        ...data,
        code,
        status: 'pending',
        createdById,
      },
    });

    logger.info(`Ride created: ${code}`, { rideId: ride.id });

    return ride;
  }

  async update(id: string, data: UpdateRideInput): Promise<Ride> {
    const ride = await this.prisma.ride.findUnique({ where: { id } });

    if (!ride) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(ride.status, data.status);
    }

    return this.prisma.ride.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'completed' && { completedAt: new Date() }),
        ...(data.status === 'cancelled' && { cancelledAt: new Date() }),
      },
    });
  }

  async assignDriver(rideId: string, driverId: string): Promise<Ride> {
    const [ride, driver] = await Promise.all([
      this.prisma.ride.findUnique({ where: { id: rideId } }),
      this.prisma.driver.findUnique({ where: { id: driverId } }),
    ]);

    if (!ride) {
      throw new AppError('Viaje no encontrado', 404);
    }

    if (!driver) {
      throw new AppError('Conductor no encontrado', 404);
    }

    if (ride.status !== 'pending') {
      throw new AppError('Solo se pueden asignar viajes pendientes', 400);
    }

    if (!driver.isOnline) {
      throw new AppError('El conductor no está disponible', 400);
    }

    // Validate driver capabilities
    if (ride.hasPet && !driver.acceptsPets) {
      throw new AppError('Este conductor no acepta mascotas', 400);
    }

    if (ride.requiresAssistance && !driver.acceptsSeniors) {
      throw new AppError('Este conductor no ofrece servicio asistido', 400);
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        driverId,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    logger.info(`Driver ${driverId} assigned to ride ${ride.code}`);

    return updatedRide;
  }

  private async generateRideCode(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const count = await this.prisma.ride.count({
      where: {
        requestedAt: {
          gte: new Date(year, 0, 1),
        },
      },
    });
    return `VJ-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private validateStatusTransition(current: RideStatus, next: RideStatus): void {
    const validTransitions: Record<RideStatus, RideStatus[]> = {
      pending: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new AppError(
        `No se puede cambiar de "${current}" a "${next}"`,
        400
      );
    }
  }
}
```

### Schema (Validation)

```typescript
// src/modules/rides/rides.schema.ts
import { z } from 'zod';

export const LocationSchema = z.object({
  address: z.string().min(1, 'La dirección es requerida'),
  latitude: z.number(),
  longitude: z.number(),
  reference: z.string().optional(),
});

export const CreateRideSchema = z.object({
  passengerId: z.string().uuid('ID de pasajero inválido'),
  origin: LocationSchema,
  destination: LocationSchema,
  serviceType: z.enum(['standard', 'pets', 'senior', 'premium']),
  hasPet: z.boolean().optional(),
  petDetails: z.object({
    type: z.string(),
    size: z.enum(['small', 'medium', 'large']),
    carrier: z.boolean(),
  }).optional(),
  requiresAssistance: z.boolean().optional(),
  assistanceNotes: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const UpdateRideSchema = z.object({
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']).optional(),
  finalPrice: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const RideQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']).optional(),
  serviceType: z.enum(['standard', 'pets', 'senior', 'premium']).optional(),
  driverId: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type CreateRideInput = z.infer<typeof CreateRideSchema>;
export type UpdateRideInput = z.infer<typeof UpdateRideSchema>;
export type RideQuery = z.infer<typeof RideQuerySchema>;
```

### Routes

```typescript
// src/modules/rides/rides.routes.ts
import { Router } from 'express';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { validateMiddleware } from '@/middlewares/validate.middleware';
import { CreateRideSchema, UpdateRideSchema } from './rides.schema';
import { prisma } from '@/config/database';

const router = Router();
const service = new RidesService(prisma);
const controller = new RidesController(service);

// All routes require authentication
router.use(authMiddleware);

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', validateMiddleware(CreateRideSchema), controller.create.bind(controller));
router.patch('/:id', validateMiddleware(UpdateRideSchema), controller.update.bind(controller));
router.post('/:id/assign', controller.assignDriver.bind(controller));

export { router as ridesRouter };
```

## Utilities

### API Responses

```typescript
// src/utils/response.ts
import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiResponse {
  static success<T>(res: Response, options: {
    data: T;
    message?: string;
    meta?: Record<string, unknown>;
  }) {
    const response: SuccessResponse<T> = {
      success: true,
      data: options.data,
      ...(options.message && { message: options.message }),
      ...(options.meta && { meta: options.meta }),
    };
    return res.json(response);
  }

  static created<T>(res: Response, options: { data: T; message?: string }) {
    return res.status(201).json({
      success: true,
      data: options.data,
      message: options.message,
    });
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, status: number, code: string, message: string, details?: unknown) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };
    return res.status(status).json(response);
  }

  static badRequest(res: Response, message: string, details?: unknown) {
    return this.error(res, 400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(res: Response, message = 'No autorizado') {
    return this.error(res, 401, 'UNAUTHORIZED', message);
  }

  static forbidden(res: Response, message = 'Acceso denegado') {
    return this.error(res, 403, 'FORBIDDEN', message);
  }

  static notFound(res: Response, message = 'Recurso no encontrado') {
    return this.error(res, 404, 'NOT_FOUND', message);
  }

  static serverError(res: Response, message = 'Error interno del servidor') {
    return this.error(res, 500, 'INTERNAL_ERROR', message);
  }
}
```

### Error Handling

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string) {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  static unauthorized(message = 'No autorizado') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Acceso denegado') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }
}

// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/utils/errors';
import { ApiResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof ZodError) {
    return ApiResponse.badRequest(res, 'Datos de entrada inválidos', error.errors);
  }

  if (error instanceof AppError) {
    return ApiResponse.error(res, error.statusCode, error.code, error.message);
  }

  // Unhandled error
  return ApiResponse.serverError(res);
}
```

### Logger

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wego-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
```

## Security

### Authentication

```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/errors';
import { prisma } from '@/config/database';

interface JwtPayload {
  userId: string;
  role: string;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Token no proporcionado');
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Usuario no válido');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Token inválido'));
    } else {
      next(error);
    }
  }
}
```

### Rate Limiting

```typescript
// src/middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Demasiadas solicitudes, intenta más tarde',
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Demasiados intentos de autenticación',
    },
  },
});
```

## Language Rules

- **User-facing messages** (API responses): Spanish (Colombia)
- **Code, comments, logs**: English
- **Variable and function names**: English

```typescript
// ✅ Correct - Spanish user message, English code
throw new AppError('Viaje no encontrado', 404);
logger.info('Ride created', { rideId: ride.id });

// ❌ Incorrect - English user message
throw new AppError('Ride not found', 404);
```

## Delivery Checklist

- [ ] TypeScript without errors
- [ ] Zod validation on all inputs
- [ ] Consistent error handling
- [ ] Appropriate logging
- [ ] User messages in Spanish
- [ ] Unit tests
- [ ] Endpoint documentation
- [ ] No security vulnerabilities

---

*See `CLAUDE.md` for general project conventions.*
