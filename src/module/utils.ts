import { nanoid } from "nanoid";
import uuid from "bun";
import { ulid } from "ulid";
export const defaultID = nanoid();

console.log("ulid", ulid());
console.log("v7", uuid.randomUUIDv7());
console.log("Nano", defaultID);
