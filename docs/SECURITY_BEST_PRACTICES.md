# 🔒 Security Best Practices - Benalsam Monorepo

## 📋 **Genel Bakış**

Bu doküman, Benalsam monorepo projesinde uygulanan güvenlik best practices'lerini açıklar.

---

## 🛡️ **Docker Security**

### **1. Non-Root User**
```dockerfile
# Tüm Dockerfile'larda non-root user kullanımı
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001
USER appuser
```

### **2. Multi-Stage Builds**
```dockerfile
# Security scanning stage
FROM aquasec/trivy:latest AS security-scan
COPY --from=builder /app/dist /app/dist
RUN trivy filesystem /app/dist --exit-code 1 --severity HIGH,CRITICAL
```

### **3. Resource Limits**
```yaml
# Docker Compose'da resource limits
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

### **4. Security Options**
```yaml
# Security hardening
security_opt:
  - no-new-privileges:true
read_only: false
tmpfs:
  - /tmp
  - /var/tmp
```

---

## 🔐 **Application Security**

### **1. Environment Variables**
```bash
# Hassas bilgiler environment variables'da
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
```

### **2. CORS Configuration**
```typescript
// Strict CORS policy
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || securityConfig.corsOrigin.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

### **3. Rate Limiting**
```typescript
// API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### **4. Input Validation**
```typescript
// Joi validation
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});
```

---

## 🔍 **Security Scanning**

### **1. Trivy Security Scanner**
```bash
# Docker image scanning
trivy image benalsam/admin-backend:latest --severity HIGH,CRITICAL

# Filesystem scanning
trivy filesystem ./src --severity HIGH,CRITICAL
```

### **2. Dependency Scanning**
```bash
# NPM audit
npm audit --audit-level=high

# PNPM audit
pnpm audit --audit-level=high
```

### **3. Automated Security Script**
```bash
# Security scan script
./scripts/security-scan.sh
```

---

## 🚨 **Security Headers**

### **1. Nginx Security Headers**
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### **2. Helmet.js Configuration**
```typescript
// Express security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

## 🔑 **Authentication & Authorization**

### **1. JWT Token Security**
```typescript
// JWT token validation
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### **2. Password Hashing**
```typescript
// bcrypt password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

---

## 📊 **Monitoring & Logging**

### **1. Security Logging**
```typescript
// Winston logger with security events
logger.info('User login attempt', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});
```

### **2. Health Checks**
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

---

## 🛠️ **Development Security**

### **1. Environment Separation**
```bash
# Development
NODE_ENV=development
CORS_ORIGIN=http://localhost:3003,http://localhost:5173

# Production
NODE_ENV=production
CORS_ORIGIN=https://admin.benalsam.com,https://benalsam.com
```

### **2. Code Review Checklist**
- [ ] Security headers implemented
- [ ] Input validation added
- [ ] Rate limiting configured
- [ ] Authentication required
- [ ] Authorization checks
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection

---

## 📋 **Security Checklist**

### **Pre-Deployment**
- [ ] Security scan completed
- [ ] Dependencies updated
- [ ] Environment variables secured
- [ ] SSL certificates valid
- [ ] Health checks passing
- [ ] Resource limits set
- [ ] Non-root user configured

### **Post-Deployment**
- [ ] Security monitoring active
- [ ] Logs being collected
- [ ] Backup strategy in place
- [ ] Incident response plan ready
- [ ] Regular security audits scheduled

---

## 🚨 **Incident Response**

### **1. Security Incident Process**
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Impact analysis
3. **Containment**: Immediate response
4. **Eradication**: Root cause removal
5. **Recovery**: Service restoration
6. **Lessons Learned**: Process improvement

### **2. Contact Information**
- **Security Team**: security@benalsam.com
- **Emergency**: +90 XXX XXX XX XX
- **Escalation**: CTO direct line

---

## 📚 **Resources**

### **Tools**
- **Trivy**: Container security scanner
- **NPM Audit**: Dependency vulnerability scanner
- **Helmet.js**: Security middleware
- **Winston**: Logging framework

### **Documentation**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Son Güncelleme:** 2025-01-09  
**Versiyon:** 1.0.0  
**Güncelleyen:** AI Assistant  
**Onaylayan:** Security Team 