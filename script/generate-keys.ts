import { exportJWK } from "jose";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const keyDir = path.join(process.cwd(), "keys");
const privPath = path.join(keyDir, "private.jwk.json");
const pubPath = path.join(keyDir, "public.jwk.json");

const generateAndPersistKeys = async () => {
    if (!existsSync(keyDir)) mkdirSync(keyDir, { recursive: true });

    const { privateKey, publicKey } = await crypto.subtle.generateKey(
        {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // ✅ mark as extractable so exportJWK works
        ["sign", "verify"],
    );

    const privJWK = await exportJWK(privateKey);
    const pubJWK = await exportJWK(publicKey);

    pubJWK.kid = "aether-auth-key";
    pubJWK.use = "sig";
    pubJWK.alg = "RS256";

    writeFileSync(privPath, JSON.stringify(privJWK, null, 2), "utf-8");
    writeFileSync(pubPath, JSON.stringify(pubJWK, null, 2), "utf-8");
};

await generateAndPersistKeys();
