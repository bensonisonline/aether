type IUserToken = {
    id: string;
    email: string;
    username: string;
};

type IStore = {
    requestId?: string;
    userAgent?: string;
    ip?: string;
    platform?: string;
    user?: IUserToken;
};

type MailOptions = {
    from: string;
    to: string;
    subject: string;
    html: string;
};

interface RequestStore {
    requestId: string;
    ip: string;
    userAgent: string;
    platform: "mobile" | "browser";
    user?: {
        id: string;
        email?: string;
    };
}
