export type ListingEventType = 'listing.insert' | 'listing.update' | 'listing.delete' | 'listing.status.changed';
export interface BaseEventEnvelope<TPayload = unknown> {
    eventType: ListingEventType;
    occurredAt: string;
    correlationId?: string;
    requestId?: string;
    producer: string;
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
export declare const baseEnvelopeSchema: {
    readonly $id: "https://benalsam.dev/schemas/events/baseEnvelope.json";
    readonly type: "object";
    readonly required: readonly ["eventType", "occurredAt", "producer", "payload"];
    readonly additionalProperties: false;
    readonly properties: {
        readonly eventType: {
            readonly type: "string";
            readonly enum: readonly ["listing.insert", "listing.update", "listing.delete", "listing.status.changed"];
        };
        readonly occurredAt: {
            readonly type: "string";
            readonly format: "date-time";
        };
        readonly correlationId: {
            readonly type: "string";
        };
        readonly requestId: {
            readonly type: "string";
        };
        readonly producer: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly payload: {
            readonly type: "object";
        };
    };
};
export declare const listingInsertSchema: {
    readonly $id: "https://benalsam.dev/schemas/events/listingInsert.json";
    readonly type: "object";
    readonly required: readonly ["listingId", "title", "category_id", "status", "user_id"];
    readonly additionalProperties: true;
    readonly properties: {
        readonly listingId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly title: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly description: {
            readonly type: "string";
        };
        readonly category_id: {
            readonly type: "integer";
        };
        readonly status: {
            readonly type: "string";
        };
        readonly user_id: {
            readonly type: "string";
        };
    };
};
export declare const listingUpdateSchema: {
    readonly $id: "https://benalsam.dev/schemas/events/listingUpdate.json";
    readonly type: "object";
    readonly required: readonly ["listingId", "after"];
    readonly additionalProperties: true;
    readonly properties: {
        readonly listingId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly before: {
            readonly type: "object";
        };
        readonly after: {
            readonly type: "object";
        };
    };
};
export declare const listingDeleteSchema: {
    readonly $id: "https://benalsam.dev/schemas/events/listingDelete.json";
    readonly type: "object";
    readonly required: readonly ["listingId"];
    readonly additionalProperties: true;
    readonly properties: {
        readonly listingId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly reason: {
            readonly type: "string";
        };
    };
};
export declare const listingStatusChangedSchema: {
    readonly $id: "https://benalsam.dev/schemas/events/listingStatusChanged.json";
    readonly type: "object";
    readonly required: readonly ["listingId", "from", "to"];
    readonly additionalProperties: true;
    readonly properties: {
        readonly listingId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly from: {
            readonly type: "string";
        };
        readonly to: {
            readonly type: "string";
        };
        readonly reason: {
            readonly type: "string";
        };
    };
};
export declare const listingEnvelopeSchemas: {
    baseEnvelopeSchema: {
        readonly $id: "https://benalsam.dev/schemas/events/baseEnvelope.json";
        readonly type: "object";
        readonly required: readonly ["eventType", "occurredAt", "producer", "payload"];
        readonly additionalProperties: false;
        readonly properties: {
            readonly eventType: {
                readonly type: "string";
                readonly enum: readonly ["listing.insert", "listing.update", "listing.delete", "listing.status.changed"];
            };
            readonly occurredAt: {
                readonly type: "string";
                readonly format: "date-time";
            };
            readonly correlationId: {
                readonly type: "string";
            };
            readonly requestId: {
                readonly type: "string";
            };
            readonly producer: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly payload: {
                readonly type: "object";
            };
        };
    };
    listingInsertSchema: {
        readonly $id: "https://benalsam.dev/schemas/events/listingInsert.json";
        readonly type: "object";
        readonly required: readonly ["listingId", "title", "category_id", "status", "user_id"];
        readonly additionalProperties: true;
        readonly properties: {
            readonly listingId: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly title: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly description: {
                readonly type: "string";
            };
            readonly category_id: {
                readonly type: "integer";
            };
            readonly status: {
                readonly type: "string";
            };
            readonly user_id: {
                readonly type: "string";
            };
        };
    };
    listingUpdateSchema: {
        readonly $id: "https://benalsam.dev/schemas/events/listingUpdate.json";
        readonly type: "object";
        readonly required: readonly ["listingId", "after"];
        readonly additionalProperties: true;
        readonly properties: {
            readonly listingId: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly before: {
                readonly type: "object";
            };
            readonly after: {
                readonly type: "object";
            };
        };
    };
    listingDeleteSchema: {
        readonly $id: "https://benalsam.dev/schemas/events/listingDelete.json";
        readonly type: "object";
        readonly required: readonly ["listingId"];
        readonly additionalProperties: true;
        readonly properties: {
            readonly listingId: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly reason: {
                readonly type: "string";
            };
        };
    };
    listingStatusChangedSchema: {
        readonly $id: "https://benalsam.dev/schemas/events/listingStatusChanged.json";
        readonly type: "object";
        readonly required: readonly ["listingId", "from", "to"];
        readonly additionalProperties: true;
        readonly properties: {
            readonly listingId: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly from: {
                readonly type: "string";
            };
            readonly to: {
                readonly type: "string";
            };
            readonly reason: {
                readonly type: "string";
            };
        };
    };
};
//# sourceMappingURL=listing.d.ts.map