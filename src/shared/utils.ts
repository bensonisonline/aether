export function formatOtpStrict(otp: string | number): string {
    const digits = String(otp).replace(/\D/g, "");
    if (digits.length !== 6) throw new Error("OTP must be exactly 6 digits");
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}
