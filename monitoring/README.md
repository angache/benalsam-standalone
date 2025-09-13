# Benalsam Monitoring Stack

Bu monitoring stack, Benalsam sisteminin kapsamlı izlenmesi için tasarlanmıştır.

## 🚀 Hızlı Başlangıç

```bash
# Monitoring stack'i başlat
./start-monitoring.sh

# Monitoring stack'i durdur
docker-compose -f docker-compose.monitoring.yml down
```

## 📊 Servisler

### Grafana (Port 3000)
- **URL**: http://localhost:3000
- **Kullanıcı**: admin
- **Şifre**: admin123
- **Özellikler**:
  - System dashboards
  - Custom metrics visualization
  - Alert management
  - Log exploration

### Prometheus (Port 9090)
- **URL**: http://localhost:9090
- **Özellikler**:
  - Metrics collection
  - Query interface
  - Alert rules
  - Service discovery

### AlertManager (Port 9093)
- **URL**: http://localhost:9093
- **Özellikler**:
  - Alert routing
  - Notification management
  - Silence management
  - Alert grouping

### Loki (Port 3100)
- **URL**: http://localhost:3100
- **Özellikler**:
  - Log aggregation
  - Log querying
  - Log visualization

## 📈 Metrikler

### System Metrics
- CPU usage
- Memory usage
- Disk space
- Network I/O

### Application Metrics
- Message processing rate
- Error rate
- Response time
- Queue depth
- Circuit breaker status

### Business Metrics
- Job completion rate
- DLQ message count
- Health check status
- Service availability

## 🚨 Alert Rules

### Critical Alerts
- Service down
- High error rate (>10%)
- Circuit breaker open
- Disk space low (<10%)

### Warning Alerts
- High memory usage (>90%)
- High CPU usage (>80%)
- Queue depth high (>1000)
- High response time (>5s)

## 📋 Dashboard'lar

### System Overview
- Service status
- Resource usage
- Performance metrics

### Message Processing
- Processing rate
- Error rate
- Response time distribution
- Queue metrics

### Infrastructure
- System resources
- Network metrics
- Storage metrics

## 🔧 Konfigürasyon

### Prometheus
- `monitoring/prometheus/prometheus.yml`: Scrape konfigürasyonu
- `monitoring/prometheus/rules/`: Alert rules

### Grafana
- `monitoring/grafana/provisioning/`: Datasource ve dashboard konfigürasyonu
- `monitoring/grafana/dashboards/`: Custom dashboard'lar

### AlertManager
- `monitoring/alertmanager/alertmanager.yml`: Alert routing ve notification

## 📝 Log Management

### Log Sources
- Elasticsearch Service logs
- Admin Backend logs
- System logs
- Application logs

### Log Levels
- ERROR: Critical errors
- WARN: Warning conditions
- INFO: Informational messages
- DEBUG: Debug information

## 🛠️ Troubleshooting

### Servis Kontrolü
```bash
# Container durumları
docker-compose -f docker-compose.monitoring.yml ps

# Log görüntüleme
docker-compose -f docker-compose.monitoring.yml logs -f [service-name]

# Servis yeniden başlatma
docker-compose -f docker-compose.monitoring.yml restart [service-name]
```

### Metrik Kontrolü
```bash
# Prometheus metrics
curl http://localhost:9090/api/v1/targets

# ES Service metrics
curl http://localhost:3006/metrics
```

### Alert Kontrolü
```bash
# AlertManager alerts
curl http://localhost:9093/api/v1/alerts

# Prometheus alerts
curl http://localhost:9090/api/v1/rules
```

## 📚 Kaynaklar

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Loki Documentation](https://grafana.com/docs/loki/)

## 🔄 Güncelleme

```bash
# Monitoring stack'i güncelle
docker-compose -f docker-compose.monitoring.yml pull
docker-compose -f docker-compose.monitoring.yml up -d
```
