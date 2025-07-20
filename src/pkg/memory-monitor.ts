import { log } from "@/pkg/log";
import os from "os";

// Monitor memory usage
export const setupMemoryMonitoring = () => {
    setInterval(() => {
        const freeMB = os.freemem() / 1024 / 1024;
        const totalMB = os.totalmem() / 1024 / 1024;
        const usedPercentage = ((totalMB - freeMB) / totalMB) * 100;

        log.info(
            `Memory: ${freeMB.toFixed(1)}MB free / ${totalMB.toFixed(1)}MB total | ${usedPercentage.toFixed(1)}% used`,
        );

        if (freeMB < 100) {
            log.warn("⚠️ Low memory warning!");
        }
    }, 500000);
};
