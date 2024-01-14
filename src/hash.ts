import { createHash } from "crypto";

export const getSimpleHash = (serverCount: number, id: string): number => {
  const hash = createHash("md5").update(id).digest().toString("hex");
  const hash_int = parseInt(hash, 16);
  const partition = hash_int % serverCount;
  return partition;
};
