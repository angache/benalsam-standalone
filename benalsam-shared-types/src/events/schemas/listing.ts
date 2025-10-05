// Listing event JSON Schemas and TS types
// Exported in a framework-agnostic way so Node/Deno services can import

export type ListingEventType =
  | 'listing.insert'
  | 'listing.update'
  | 'listing.delete'
  | 'listing.status.changed';

export interface BaseEventEnvelope<TPayload = unknown> {
  eventType: ListingEventType;
  occurredAt: string; // ISO
  correlationId?: string;
  requestId?: string;
  producer: string; // service name
  payload: TPayload;
}

export interface ListingPayloadBase {
  listingId: string;
}

export interface ListingInsertPayload extends ListingPayloadBase {
  title: string;
  description?: string;
  category_id: number;
  status: 'active' | 'pending' | 'rejected' | 'deleted' | 'inactive';
  user_id: string;
}

export interface ListingUpdatePayload extends ListingPayloadBase {
  before?: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface ListingDeletePayload extends ListingPayloadBase {
  reason?: string;
}

export interface ListingStatusChangedPayload extends ListingPayloadBase {
  from: string;
  to: string;
  reason?: string;
}

// JSON Schemas (draft-07 compatible)
export const baseEnvelopeSchema = {
  $id: 'https://benalsam.dev/schemas/events/baseEnvelope.json',
  type: 'object',
  required: ['eventType', 'occurredAt', 'producer', 'payload'],
  additionalProperties: false,
  properties: {
    eventType: {
      type: 'string',
      enum: ['listing.insert', 'listing.update', 'listing.delete', 'listing.status.changed']
    },
    occurredAt: { type: 'string', format: 'date-time' },
    correlationId: { type: 'string' },
    requestId: { type: 'string' },
    producer: { type: 'string', minLength: 1 },
    payload: { type: 'object' }
  }
} as const;

const listingIdProp = { type: 'string', minLength: 1 } as const;

export const listingInsertSchema = {
  $id: 'https://benalsam.dev/schemas/events/listingInsert.json',
  type: 'object',
  required: ['listingId', 'title', 'category_id', 'status', 'user_id'],
  additionalProperties: true,
  properties: {
    listingId: listingIdProp,
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    category_id: { type: 'integer' },
    status: { type: 'string' },
    user_id: { type: 'string' }
  }
} as const;

export const listingUpdateSchema = {
  $id: 'https://benalsam.dev/schemas/events/listingUpdate.json',
  type: 'object',
  required: ['listingId', 'after'],
  additionalProperties: true,
  properties: {
    listingId: listingIdProp,
    before: { type: 'object' },
    after: { type: 'object' }
  }
} as const;

export const listingDeleteSchema = {
  $id: 'https://benalsam.dev/schemas/events/listingDelete.json',
  type: 'object',
  required: ['listingId'],
  additionalProperties: true,
  properties: {
    listingId: listingIdProp,
    reason: { type: 'string' }
  }
} as const;

export const listingStatusChangedSchema = {
  $id: 'https://benalsam.dev/schemas/events/listingStatusChanged.json',
  type: 'object',
  required: ['listingId', 'from', 'to'],
  additionalProperties: true,
  properties: {
    listingId: listingIdProp,
    from: { type: 'string' },
    to: { type: 'string' },
    reason: { type: 'string' }
  }
} as const;

export const listingEnvelopeSchemas = {
  baseEnvelopeSchema,
  listingInsertSchema,
  listingUpdateSchema,
  listingDeleteSchema,
  listingStatusChangedSchema
};


