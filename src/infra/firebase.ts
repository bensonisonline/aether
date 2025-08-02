import admin from "firebase-admin";

if (!admin.apps.length) {
    const serviceAccount = {
        type: Bun.env.FIREBASE_TYPE,
        project_id: Bun.env.FIREBASE_PROJECT_ID,
        private_key_id: Bun.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: Bun.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: Bun.env.FIREBASE_CLIENT_EMAIL,
        client_id: Bun.env.FIREBASE_CLIENT_ID,
        auth_uri: Bun.env.FIREBASE_AUTH_URI,
        token_uri: Bun.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url:
            Bun.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: Bun.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    admin.initializeApp({
        credential: admin.credential.cert(
            serviceAccount as admin.ServiceAccount,
        ),
        projectId: Bun.env.FIREBASE_PROJECT_ID,
    });
}

export const firebaseAuth = admin.auth();
export default admin;
