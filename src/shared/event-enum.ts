export enum BaseEvents {
    // Server lifecycle events
    SERVER_START = "SERVER_START",
    SERVER_START_FAILED = "SERVER_START_FAILED",
    SERVER_SHUTDOWN = "SERVER_SHUTDOWN",
    SERVER_STOPPED = "SERVER_STOPPED",

    // Request lifecycle events
    REQUEST_RECEIVED = "REQUEST_RECEIVED",
    REQUEST_COMPLETED = "REQUEST_COMPLETED",
    ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",

    // HTTP Error events
    HTTP_ERROR = "HTTP_ERROR",
    UNHANDLED_ERROR = "UNHANDLED_ERROR",
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",

    // Database events
    DB_CONNECTED = "DB_CONNECTED",
    DB_CONNECTION_ERROR = "DB_CONNECTION_ERROR",
    DB_DISCONNECTED = "DB_DISCONNECTED",
    REDIS_CONNECTED = "REDIS_CONNCTED",
    REDIS_CONNECTION_ERROR = "REDIS_CONNECTION_ERROR",
    REDIS_DISCONNECTED = "REDIS_DISCONNECTED",
    REDIS_PING = "REDIS_READY",
    REDIS_PING_FAILED = "REDIS_PING_FAILED",

    // Authentication events
    AUTH_SUCCESS = "AUTH_SUCCESS",
    AUTH_FAILED = "AUTH_FAILED",
    TOKEN_VALIDATED = "TOKEN_VALIDATED",
    TOKEN_INVALID = "TOKEN_INVALID",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_REUSE = "TOKEN_REUSE",

    // CRUD Operation events
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    DELETED = "DELETED",

    // Validation events
    VALIDATION_SUCCESS = "VALIDATION_SUCCESS",
    VALIDATION_FAILED = "VALIDATION_FAILED",

    // Security events
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    CORS_VIOLATION = "CORS_VIOLATION",
    CSRF_VIOLATION = "CSRF_VIOLATION",
}

// Type-safe dynamic event generator
type ResourceEvents = {
    found: (resource: string) => string;
    notFound: (resource: string) => string;
    operation: (operation: string, resource: string) => string;
};

export const Events: typeof BaseEvents & ResourceEvents = {
    ...BaseEvents,
    found: (resource: string) => `${resource.toUpperCase()}_FOUND`,
    notFound: (resource: string) => `${resource.toUpperCase()}_NOT_FOUND`,
    operation: (operation: string, resource: string) =>
        `${resource.toUpperCase()}_${operation.toUpperCase()}`,
};
