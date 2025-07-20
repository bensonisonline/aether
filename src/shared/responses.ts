import { HttpStatus } from "./http-status";

type SuccessType<T> = {
    success: true;
    message: string;
    data: T;
    status: number;
};

export function SuccessResponse<T>(
    status: HttpStatus.OK | HttpStatus.CREATED | HttpStatus.FOUND,
    message: string,
    data: T,
): SuccessType<T> {
    return { success: true, status, message, data };
}

export class HttpError extends Error {
    status: number;
    title: string;
    success: boolean = false;

    constructor(message: string, status: number, title: string) {
        super(message);
        this.status = status;
        this.title = title;
    }

    // Convert error to a Bun-compatible Response
    toResponse(): Response {
        return new Response(
            JSON.stringify({
                success: this.success,
                message: this.message,
                status: this.status,
                title: this.title,
            }),
            {
                status: this.status,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string = "Bad Request") {
        super(message, 400, "BadRequestError");
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string = "Unauthorized") {
        super(message, 401, "UnauthorizedError");
    }
}

export class ForbiddenError extends HttpError {
    constructor(message: string = "Forbidden") {
        super(message, 403, "ForbiddenError");
    }
}

export class NotFoundError extends HttpError {
    constructor(message: string = "Not Found") {
        super(message, 404, "NotFoundError");
    }
}

export class ConflictError extends HttpError {
    constructor(message: string = "Conflict") {
        super(message, 409, "ConflictError");
    }
}

export class InternalServerError extends HttpError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500, "InternalServerError");
    }
}
