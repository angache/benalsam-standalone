# Benalsam Event System

Bu klasör, Benalsam projesinin event-driven mimarisini içerir. RabbitMQ message broker ve Consul service discovery sistemlerini kullanarak, mikroservisler arası iletişimi sağlar.

## Geliştirme Ortamı

### Başlatma
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Kontrol
- RabbitMQ UI: http://localhost:15672 
  - Kullanıcı: benalsam
  - Şifre: benalsam123
- Consul UI: http://localhost:8500

### Durdurma
```bash
docker-compose -f docker-compose.dev.yml down
```

## Servis Portları

- RabbitMQ:
  - 5672: AMQP protokolü
  - 15672: Yönetim UI
- Consul:
  - 8500: HTTP API & UI
  - 8600: DNS

## Volume Bilgileri

- `consul-data`: Consul veritabanı
- `rabbitmq-data`: RabbitMQ veritabanı ve konfigürasyonları

## Network

Tüm servisler `benalsam-event-network` adlı bir Docker network üzerinde çalışır.
