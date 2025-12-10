# Deployment Guide

This guide covers deploying the Enterprise App Template to production.

## Pre-deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Domain names configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place

## Deployment Options

### Option 1: Docker Compose (Simple)

Best for small-scale deployments or staging environments.

```bash
# On your server
git clone <repository-url>
cd scalable-app-template

# Set environment variables
cp .env.example .env
# Edit .env with production values

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 2: Kubernetes (Scalable)

For production environments requiring high availability and scalability.

#### Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl configured
- Docker images pushed to registry

#### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace enterprise-app

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=secret-key=$SECRET_KEY \
  -n enterprise-app

# Apply configurations
kubectl apply -f k8s/ -n enterprise-app

# Check deployment status
kubectl get pods -n enterprise-app
kubectl get services -n enterprise-app
```

### Option 3: Cloud Platforms

#### AWS Deployment

**Backend (ECS + RDS):**

```bash
# Build and push Docker image
docker build -f docker/backend.Dockerfile -t backend:latest .
docker tag backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/backend:latest

# Deploy to ECS using AWS CLI or Terraform
```

**Frontend (S3 + CloudFront):**

```bash
cd web
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

#### Google Cloud Platform

```bash
# Build and deploy backend to Cloud Run
gcloud builds submit --tag gcr.io/$PROJECT_ID/backend
gcloud run deploy backend \
  --image gcr.io/$PROJECT_ID/backend \
  --platform managed \
  --region us-central1

# Deploy frontend to Cloud Storage + Cloud CDN
cd web
npm run build
gsutil -m rsync -r dist gs://your-bucket-name
```

#### Azure

```bash
# Deploy backend to Azure Container Instances
az container create \
  --resource-group myResourceGroup \
  --name backend \
  --image your-registry.azurecr.io/backend:latest \
  --ports 8000

# Deploy frontend to Azure Static Web Apps
cd web
npm run build
# Use Azure Portal or CLI to deploy
```

## Environment Configuration

### Production Environment Variables

**Backend:**

```bash
# Application
PROJECT_NAME=Enterprise App
VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false

# Security
SECRET_KEY=<generate-strong-random-key>
JWT_SECRET=<generate-strong-random-key>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
DATABASE_URL_SYNC=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379/0

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

**Web:**

```bash
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=Enterprise App
```

## Database Setup

### Initial Database Setup

```bash
# Connect to production database
psql $DATABASE_URL

# Or using Docker
docker exec -it production-db psql -U postgres

# Run migrations
alembic upgrade head
```

### Database Backups

**Automated Backups (PostgreSQL):**

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
FILENAME="backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_DIR/$FILENAME
gzip $BACKUP_DIR/$FILENAME

# Upload to S3
aws s3 cp $BACKUP_DIR/$FILENAME.gz s3://your-backup-bucket/

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

**Schedule with cron:**

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron)
0 0 1 * * certbot renew --quiet
```

### Using Cloud Provider SSL

Most cloud providers offer managed SSL certificates:
- AWS Certificate Manager (ACM)
- Google Cloud Managed SSL
- Azure App Service Certificates

## Monitoring and Logging

### Application Monitoring

**Sentry (Error Tracking):**

```python
# Already configured in src/main.py
# Just set SENTRY_DSN environment variable
```

**Prometheus + Grafana:**

```yaml
# Add Prometheus metrics endpoint
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### Log Aggregation

**Using ELK Stack:**

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: elasticsearch:8.11.0

  logstash:
    image: logstash:8.11.0

  kibana:
    image: kibana:8.11.0
```

**Using Cloud Services:**
- AWS CloudWatch
- Google Cloud Logging
- Azure Monitor

## Performance Optimization

### Backend Optimization

1. **Enable caching:**

```python
# Redis caching example
from redis import Redis
cache = Redis.from_url(settings.REDIS_URL)

@app.get("/expensive-operation")
async def cached_endpoint():
    cached = cache.get("result")
    if cached:
        return json.loads(cached)

    result = expensive_operation()
    cache.setex("result", 3600, json.dumps(result))
    return result
```

2. **Database connection pooling:**

Already configured in `src/infrastructure/database.py`

3. **Background tasks:**

```python
# Use Celery for long-running tasks
from celery import Celery

celery = Celery('tasks', broker=settings.CELERY_BROKER_URL)

@celery.task
def send_email(user_id: str):
    # Send email logic
    pass
```

### Frontend Optimization

1. **Build optimizations:**

Already configured in `vite.config.ts`

2. **CDN for static assets:**

Configure your CDN to serve from the build directory.

3. **Compression:**

Nginx gzip configuration already in `docker/nginx.conf`

## Health Checks

**Backend health endpoint:**

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": await check_database_health(),
        "redis": await check_redis_health(),
    }
```

**Kubernetes health checks:**

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Scaling

### Horizontal Scaling

**Backend:**
- Stateless design allows easy horizontal scaling
- Use load balancer (ALB, GCP Load Balancer, etc.)
- Scale based on CPU/memory metrics

**Database:**
- Read replicas for read-heavy workloads
- Connection pooling to manage connections
- Consider sharding for very large datasets

**Redis:**
- Redis Cluster for high availability
- Redis Sentinel for automatic failover

### Auto-scaling Configuration

**Kubernetes HPA:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Security Best Practices

1. **Use HTTPS everywhere**
2. **Set secure headers** (already configured in middleware)
3. **Keep dependencies updated**
4. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault)
5. **Enable rate limiting** (already configured)
6. **Regular security audits**
7. **Database encryption at rest**
8. **Network isolation** (VPC, security groups)

## Rollback Strategy

```bash
# Docker Compose
docker-compose down
git checkout <previous-commit>
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/backend -n enterprise-app

# Database migration rollback
alembic downgrade -1
```

## Post-Deployment

1. **Verify all services are running**
2. **Run smoke tests**
3. **Monitor error rates**
4. **Check performance metrics**
5. **Verify backups are working**
6. **Update documentation**
