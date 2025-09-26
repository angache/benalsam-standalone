# 📊 BENALSAM MONITORING GUIDE

## 🎯 Overview

Benalsam platformu enterprise-grade monitoring infrastructure ile donatılmıştır:

- **Grafana**: Dashboard ve görselleştirme
- **Prometheus**: Metrics toplama ve alerting
- **Alertmanager**: Alert yönetimi
- **Loki**: Log aggregation
- **Promtail**: Log shipping
- **Node Exporter**: System metrics
- **Redis Exporter**: Redis metrics

---

## 🚀 Quick Start

### **1. Access Monitoring Services**

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| **Grafana** | http://localhost:3000 | admin/admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **Alertmanager** | http://localhost:9093 | - |

### **2. Setup Dashboard**

```bash
# Run the setup script
./setup-grafana.sh
```

### **3. View Metrics**

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service health
curl http://localhost:3002/api/v1/health
curl http://localhost:3006/health
curl http://localhost:3007/api/v1/health
curl http://localhost:3008/api/v1/health
curl http://localhost:3012/api/v1/health
curl http://localhost:3014/api/v1/health
curl http://localhost:3015/api/v1/health
curl http://localhost:3016/api/v1/health
```

---

## 📈 Grafana Dashboard

### **Dashboard Panels**

1. **Service Health Overview**
   - Real-time service status
   - Green/Red indicators
   - Service uptime

2. **Response Time**
   - HTTP request duration
   - 95th percentile metrics
   - Service comparison

3. **Request Rate**
   - Requests per second
   - Traffic patterns
   - Peak usage times

4. **Error Rate**
   - 5xx error tracking
   - Error trends
   - Service reliability

5. **Memory Usage**
   - RSS, Heap, External memory
   - Memory leaks detection
   - Resource optimization

6. **CPU Usage**
   - CPU utilization
   - Performance bottlenecks
   - Scaling indicators

7. **Circuit Breaker Status**
   - Circuit breaker states
   - Failure patterns
   - Recovery monitoring

8. **Queue Statistics**
   - Job processing metrics
   - Queue backlog
   - Processing rates

### **Customizing Dashboard**

```bash
# Export current dashboard
curl -u admin:admin123 http://localhost:3000/api/dashboards/db/benalsam-microservices-monitoring > dashboard.json

# Import modified dashboard
curl -X POST -u admin:admin123 -H "Content-Type: application/json" -d @dashboard.json http://localhost:3000/api/dashboards/db
```

---

## 🔔 Alerting System

### **Alert Rules**

#### **Critical Alerts**
- **ServiceDown**: Service is down for >1 minute
- **CircuitBreakerOpen**: Circuit breaker is open
- **NodeExporterDown**: System monitoring is down
- **RedisDown**: Redis service is down

#### **Warning Alerts**
- **HighErrorRate**: Error rate >0.1 errors/second
- **HighResponseTime**: 95th percentile >1 second
- **HighMemoryUsage**: Memory usage >500MB
- **HighCPUUsage**: CPU usage >80%
- **QueueBacklog**: Pending jobs >100
- **HighFailedJobs**: Failed job rate >0.1/second
- **HighDiskUsage**: Disk usage >90%
- **HighSystemMemoryUsage**: System memory >90%

### **Alert Channels**

#### **Email Alerts**
```json
{
  "name": "Email Alerts",
  "type": "email",
  "settings": {
    "addresses": "admin@benalsam.com",
    "subject": "Benalsam Alert: {{ .GroupLabels.alertname }}"
  }
}
```

#### **Slack Alerts**
```json
{
  "name": "Slack Alerts",
  "type": "slack",
  "settings": {
    "url": "YOUR_SLACK_WEBHOOK_URL",
    "channel": "#alerts",
    "title": "Benalsam Alert",
    "text": "{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}"
  }
}
```

### **Alert Management**

```bash
# Check active alerts
curl http://localhost:9090/api/v1/alerts

# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check Alertmanager status
curl http://localhost:9093/api/v1/status
```

---

## 📊 Prometheus Metrics

### **Service Metrics**

#### **HTTP Metrics**
```
http_requests_total{method="GET",route="/api/v1/health",status_code="200"}
http_request_duration_seconds{method="GET",route="/api/v1/health"}
```

#### **System Metrics**
```
process_memory_usage_bytes{type="rss"}
process_cpu_seconds_total
process_uptime_seconds
```

#### **Business Metrics**
```
queue_jobs_total{status="pending|processing|completed|failed"}
circuit_breaker_state{breaker_name="database|redis|external"}
```

#### **Custom Metrics**
```
benalsam_listings_created_total
benalsam_search_queries_total
benalsam_upload_files_total
```

### **Query Examples**

```promql
# Service availability
up{job="benalsam-services"}

# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Response time 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage
process_memory_usage_bytes{type="rss"}

# CPU usage
rate(process_cpu_seconds_total[5m]) * 100

# Circuit breaker status
circuit_breaker_state

# Queue statistics
queue_jobs_total
```

---

## 📝 Log Management

### **Loki Configuration**

```yaml
# loki.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /tmp/loki/index

  filesystem:
    directory: /tmp/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

### **Log Queries**

```logql
# All logs from benalsam services
{job="benalsam-*"}

# Error logs
{job="benalsam-*"} |= "error"

# Specific service logs
{job="benalsam-listing-service"}

# Logs with specific level
{job="benalsam-*"} |= "level=error"

# Logs with specific message
{job="benalsam-*"} |= "Circuit breaker"
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Prometheus Targets Down**
```bash
# Check service connectivity
curl http://localhost:3002/api/v1/health
curl http://localhost:3002/metrics

# Check Prometheus configuration
curl http://localhost:9090/api/v1/targets
```

#### **2. Grafana Dashboard Not Loading**
```bash
# Check Grafana logs
docker logs benalsam-grafana

# Check data source
curl -u admin:admin123 http://localhost:3000/api/datasources
```

#### **3. Alerts Not Firing**
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check Alertmanager
curl http://localhost:9093/api/v1/status

# Test alert
curl -X POST http://localhost:9093/api/v1/alerts -d '[{"labels":{"alertname":"TestAlert"}}]'
```

#### **4. High Memory Usage**
```bash
# Check memory metrics
curl http://localhost:9090/api/v1/query?query=process_memory_usage_bytes

# Check service logs
docker logs benalsam-listing-service | grep -i memory
```

### **Performance Optimization**

#### **1. Reduce Scrape Interval**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'benalsam-services'
    scrape_interval: 60s  # Increase from 30s
```

#### **2. Limit Metrics Retention**
```yaml
# prometheus.yml
global:
  storage.tsdb.retention.time: 15d  # Reduce from 30d
```

#### **3. Optimize Queries**
```promql
# Use rate() for counters
rate(http_requests_total[5m])

# Use increase() for absolute values
increase(http_requests_total[1h])
```

---

## 🚀 Advanced Configuration

### **Custom Dashboards**

```json
{
  "dashboard": {
    "title": "Custom Benalsam Dashboard",
    "panels": [
      {
        "title": "Custom Metric",
        "type": "graph",
        "targets": [
          {
            "expr": "custom_metric{service=\"benalsam\"}",
            "legendFormat": "{{service}}"
          }
        ]
      }
    ]
  }
}
```

### **Custom Alert Rules**

```yaml
groups:
  - name: custom_alerts
    rules:
      - alert: CustomAlert
        expr: custom_metric > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Custom metric is high"
          description: "Custom metric is {{ $value }}"
```

### **Service Discovery**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'benalsam-services'
    consul_sd_configs:
      - server: 'consul:8500'
        services: ['benalsam-*']
```

---

## 📚 Best Practices

### **1. Monitoring Strategy**
- Set up alerts for critical metrics
- Monitor business KPIs
- Track performance trends
- Plan capacity based on metrics

### **2. Alert Management**
- Use appropriate severity levels
- Set reasonable thresholds
- Group related alerts
- Test alert channels regularly

### **3. Dashboard Design**
- Keep dashboards focused
- Use consistent color schemes
- Include context and annotations
- Make dashboards actionable

### **4. Log Management**
- Use structured logging
- Include correlation IDs
- Set appropriate log levels
- Rotate logs regularly

---

## 🔗 Useful Links

- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Prometheus Query Examples**: https://prometheus.io/docs/prometheus/latest/querying/examples/
- **Grafana Dashboard Examples**: https://grafana.com/grafana/dashboards/
- **LogQL Documentation**: https://grafana.com/docs/loki/latest/logql/

---

**🎉 Benalsam Monitoring Guide v2.0.0**

For support and updates, visit: [Benalsam GitHub](https://github.com/your-org/benalsam-standalone)
