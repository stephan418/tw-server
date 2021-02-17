import { randomBytes } from "crypto";
import { HError } from "../errors/http_errors";

export function generateIdentifier(byteLength = 8) {
  return randomBytes(byteLength).toString("hex");
}

export async function generateUniqueIdentifier(exists: (new_id: string) => boolean | Promise<boolean>, iter_limit = 100) {
  let identifier = generateIdentifier();
  let iter_count = 0;

  while ((await exists(identifier)) && iter_count < iter_limit) {
    identifier = generateIdentifier();
    iter_count++;
  }

  if (iter_count >= iter_limit) {
    throw HError.limitExceeded("IDENTIFIER_ITERATIONS", "could not find a unique identifier");
  }

  return identifier;
}
