# RFC: Unified Category & Attribute Management System

**Status**: 🟡 Draft  
**Date**: 2025-01-XX  
**Author**: CTO Team  
**Priority**: High (Strategic Impact)

---

## 📋 Executive Summary

Currently, category and attribute data exists in two separate systems:
1. **KategorilerBenalsam**: Data analysis tool with Sahibinden.com category/attribute data (49k categories, 410k attributes)
2. **Categories Service**: Production service managing Benalsam's categories and attributes

This RFC proposes a unified category management system that integrates both data sources into a single, maintainable architecture.

**Current State**: Disconnected systems with manual data sync  
**Target State**: Single source of truth with automated data pipeline

---

## 🎯 Objectives

1. **Single Source of Truth**: One authoritative system for all category/attribute data
2. **Data Pipeline**: Automated import/sync from external sources (Sahibinden.com)
3. **API Consistency**: Unified API for web, mobile, and admin interfaces
4. **Maintainability**: Reduce manual work and data duplication
5. **Scalability**: Support future data sources and category hierarchies

---

## 🔍 Current State Analysis

### KategorilerBenalsam Tool

**Location**: `/KategorilerBenalsam/`

**Purpose**: 
- Import Sahibinden.com category/attribute data to PostgreSQL
- Data analysis and exploration tool
- CLI tools for attribute merging and querying

**Data**:
- 49,047 categories
- 409,700 attributes
- Feature sections (checkbox groups)
- Full category hierarchy

**Database**: 
- Local PostgreSQL (Docker)
- Port: 5433
- Database: `sahibinden`
- Tables: `sahibinden_categories`, `sahibinden_attributes`, `sahibinden_sections`

**Tools**:
- `import.ts` - Data import script
- `query-tool.ts` - Interactive SQL shell
- `cli/attribute-merge-cli.ts` - Attribute merging tool
- `viewer-server.ts` - Web viewer for data

**Limitations**:
- ❌ Not integrated with production Categories Service
- ❌ Manual data sync required
- ❌ No API for programmatic access
- ❌ Data analysis only (not used in production)

### Categories Service

**Location**: `/benalsam-categories-service/`

**Purpose**:
- Production service for category/attribute management
- REST API for web, mobile, and admin
- Redis caching for performance
- PostgreSQL database (Supabase)

**API Endpoints**:
- `GET /api/v1/categories` - Get all categories (tree structure)
- `GET /api/v1/categories/:id` - Get category by ID
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category
- `GET /api/v1/categories/:id/attributes` - Get category attributes
- `POST /api/v1/categories/:id/attributes` - Create attribute
- `PUT /api/v1/categories/:id/attributes/:attrId` - Update attribute
- `DELETE /api/v1/categories/:id/attributes/:attrId` - Delete attribute

**Database Schema**:
```sql
-- categories table
id, name, slug, icon, parent_id, sort_order, is_active, created_at, updated_at

-- category_attributes table
id, category_id, key, label, type, required, options, sort_order, created_at, updated_at
```

**Features**:
- ✅ Hierarchical category tree
- ✅ Attribute management (string, number, boolean, array types)
- ✅ Redis caching
- ✅ Circuit breaker pattern
- ✅ Health checks

**Limitations**:
- ❌ No data import pipeline
- ❌ Manual category/attribute creation
- ❌ No integration with external data sources
- ❌ Limited attribute types compared to Sahibinden.com

---

## 🏗️ Proposed Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                             │
├─────────────────────────────────────────────────────────────┤
│  • Sahibinden.com (scraped data)                            │
│  • Manual categories (admin-created)                        │
│  • Future: Other marketplaces, AI-generated categories      │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Category Import Service                        │
├─────────────────────────────────────────────────────────────┤
│  • Scheduled imports (cron jobs)                             │
│  • Data validation & normalization                          │
│  • Conflict resolution (manual vs. external)                  │
│  • Attribute mapping & merging                               │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Categories Service (Production)                 │
├─────────────────────────────────────────────────────────────┤
│  • Unified API for all clients                               │
│  • Redis caching                                             │
│  • PostgreSQL database (Supabase)                            │
│  • Real-time updates via webhooks                            │
└─────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Web App    │ │  Mobile App  │ │  Admin UI    │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Component Design

#### 1. Category Import Service

**New Service**: `benalsam-category-import-service/`

**Responsibilities**:
- Import data from external sources (Sahibinden.com)
- Validate and normalize category/attribute data
- Merge with existing Categories Service data
- Handle conflicts (manual vs. external data)
- Schedule periodic imports (daily/weekly)

**Technology**:
- Node.js + TypeScript
- PostgreSQL client (Supabase)
- Cron scheduler (node-cron)
- Data validation (Joi/Zod)

**API Endpoints**:
- `POST /api/v1/import/sahibinden` - Manual import trigger
- `GET /api/v1/import/status` - Import status
- `POST /api/v1/import/map` - Attribute mapping configuration
- `GET /api/v1/import/conflicts` - List data conflicts

#### 2. Enhanced Categories Service

**Modifications to**: `benalsam-categories-service/`

**New Features**:
- Import history tracking
- Data source attribution (manual vs. external)
- Conflict resolution API
- Bulk import endpoints
- Attribute type expansion (support more Sahibinden.com types)

**New Database Tables**:
```sql
-- import_history table
id, source, status, records_imported, conflicts_count, started_at, completed_at, error_message

-- category_sources table (many-to-many)
category_id, source_type, source_id, imported_at, is_active

-- attribute_mappings table
id, source_attribute_key, target_category_id, target_attribute_key, mapping_rules, created_at
```

#### 3. Unified Data Model

**Category Schema** (Enhanced):
```typescript
interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  
  // New fields
  source: 'manual' | 'sahibinden' | 'ai' | 'other'
  source_id?: string // External ID (e.g., Sahibinden category ID)
  import_history_id?: string
  
  // Metadata
  created_at: string
  updated_at: string
  last_imported_at?: string
}

interface CategoryAttribute {
  id: string
  category_id: string
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'select' | 'multiselect' | 'range'
  required: boolean
  options?: string[] | { label: string; value: string }[]
  sort_order: number
  
  // New fields
  source: 'manual' | 'sahibinden' | 'mapped'
  source_key?: string // Original key from external source
  mapping_id?: string // Reference to attribute_mappings
  
  created_at: string
  updated_at: string
}
```

---

## 📊 Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Tasks**:
1. Create `benalsam-category-import-service/` structure
2. Set up database migrations for new tables
3. Create data import pipeline (Sahibinden.com → Categories Service)
4. Implement basic conflict detection

**Deliverables**:
- ✅ Import service skeleton
- ✅ Database schema updates
- ✅ Basic import functionality
- ✅ Unit tests for import logic

### Phase 2: Integration (Week 3-4)

**Tasks**:
1. Integrate import service with Categories Service
2. Implement conflict resolution UI (Admin UI)
3. Create attribute mapping system
4. Add import scheduling (cron jobs)

**Deliverables**:
- ✅ End-to-end import flow
- ✅ Admin UI for conflict resolution
- ✅ Attribute mapping configuration
- ✅ Scheduled imports working

### Phase 3: Enhancement (Week 5-6)

**Tasks**:
1. Expand attribute types (support all Sahibinden.com types)
2. Add data validation and normalization
3. Implement import history tracking
4. Create monitoring and alerting

**Deliverables**:
- ✅ Full attribute type support
- ✅ Data validation pipeline
- ✅ Import history dashboard
- ✅ Monitoring alerts

### Phase 4: Migration (Week 7-8)

**Tasks**:
1. Migrate existing KategorilerBenalsam data to Categories Service
2. Update all clients (web, mobile, admin) to use unified API
3. Deprecate KategorilerBenalsam tool (keep for reference)
4. Documentation and training

**Deliverables**:
- ✅ All data migrated
- ✅ All clients updated
- ✅ Documentation complete
- ✅ Team training done

---

## 🔄 Data Flow

### Import Flow

```
1. Scheduled Job Triggered (Daily/Weekly)
   ↓
2. Fetch Data from Sahibinden.com (or use KategorilerBenalsam DB)
   ↓
3. Validate & Normalize Data
   ↓
4. Check for Conflicts (existing categories/attributes)
   ↓
5. Resolve Conflicts (auto-merge or flag for manual review)
   ↓
6. Import to Categories Service Database
   ↓
7. Invalidate Redis Cache
   ↓
8. Send Webhook Notification (optional)
   ↓
9. Update Import History
```

### Conflict Resolution Strategy

**Auto-merge Rules**:
- If category name matches exactly → Update attributes only
- If attribute key matches → Merge options, keep manual overrides
- If no conflict → Create new category/attribute

**Manual Review Required**:
- Category name conflict with different hierarchy
- Attribute type mismatch
- Manual overrides exist

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Loss
**Risk**: Import might overwrite manual changes  
**Mitigation**:
- Track data sources (manual vs. external)
- Never auto-overwrite manual changes
- Require explicit approval for conflicts

### Risk 2: Performance Impact
**Risk**: Large imports might slow down Categories Service  
**Mitigation**:
- Run imports during low-traffic hours
- Use batch processing
- Implement rate limiting
- Monitor database performance

### Risk 3: Data Quality
**Risk**: External data might be incomplete or incorrect  
**Mitigation**:
- Data validation pipeline
- Manual review for critical categories
- Quality metrics tracking
- Rollback capability

### Risk 4: Service Coupling
**Risk**: Import service tightly coupled to Categories Service  
**Mitigation**:
- Use message queue (RabbitMQ) for async processing
- API-based communication
- Independent deployment
- Circuit breaker pattern

---

## ✅ Success Criteria

1. **Data Consistency**: Single source of truth for all categories/attributes
2. **Automation**: 90%+ of imports automated (minimal manual intervention)
3. **Performance**: Import completes in < 30 minutes for full dataset
4. **Reliability**: 99%+ import success rate
5. **Usability**: Admin UI for conflict resolution and mapping
6. **Documentation**: Complete API and operational documentation

---

## 📚 References

- Current `KategorilerBenalsam/` tool and data
- Current `benalsam-categories-service/` implementation
- Sahibinden.com category structure
- PostgreSQL best practices for bulk imports

---

## 🔄 Migration Strategy

### Step 1: Parallel Run
- Keep KategorilerBenalsam tool running
- Import service runs alongside Categories Service
- Compare outputs for validation

### Step 2: Gradual Migration
- Start with non-critical categories
- Migrate high-traffic categories last
- Monitor for issues

### Step 3: Cutover
- Switch all clients to unified API
- Deprecate KategorilerBenalsam tool (keep for reference)
- Archive old data

---

## 📝 Notes

- **Timeline**: 6-8 weeks for complete implementation
- **Breaking Changes**: None (additive changes only)
- **Dependencies**: 
  - New service: `benalsam-category-import-service`
  - Enhanced: `benalsam-categories-service`
  - Optional: RabbitMQ for async processing
- **Testing**: 
  - Unit tests for import logic
  - Integration tests for data pipeline
  - E2E tests for conflict resolution

---

**Next Steps**: 
1. Review and approve this RFC
2. Create implementation branch: `feature/unified-category-management`
3. Begin Phase 1 implementation
4. Set up project structure for import service

