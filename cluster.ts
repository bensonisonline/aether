import cluster from "cluster";
import { cpus } from "os";
import { env } from "bun";

const numCPUs = cpus().length;
const isProd = env.ENV === "production";

// Creates multiple servers in production.

if (isProd && cluster.isPrimary) {
    console.log(
        `🚀 Primary PID ${process.pid} is running. Forking ${numCPUs} workers...`,
    );

    for (let i = 0; i < numCPUs; i++) {
        // Use same port but let Caddy load-balance (see below)
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.warn(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    const entry = isProd ? "./dist/index.js" : "./src/index.ts";
    await import(entry);
}
