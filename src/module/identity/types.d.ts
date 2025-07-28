export type CreateOtpAuditLog = {
    identifier: string;
    channel: "email" | "sms";
    event: "generated" | "verified" | "failed";
    ip?: string;
    userAgent?: string;
};

export interface IAuthUser {
    name: string;
    email: string;
    fingerprint: string;
    platform: "mobile" | "browser";
}

export interface ILogin {
    email: string;
    fingerprint: string;
    platform: "mobile" | "browser";
}

export interface ISession {
    userId: string;
    fingerprint: string;
    userAgent: string;
    platform: "mobile" | "browser";
}

export interface IToken {
    id: string;
    email: string;
    status: "active" | "inactive" | "suspended";
    // role: "owner" | "staff" | "admin" | "support";

    // activeBusinessId?: string;
    // activeTeamId?: string;
    // teamIds?: string[];

    // permissions?: string[];
    // scopes?: string[];
    // features?: string[];

    // deviceId?: string;
    fingerprint?: string;
    // platform?: "web" | "mobile";
    // type?: "access" | "refresh";
}
