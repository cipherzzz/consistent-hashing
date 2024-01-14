import {
  Server,
  addServer,
  getDestinationServer,
  removeServer,
} from "./consistent-hash";
import { getSimpleHash } from "./hash";
import { v4 as uuid } from "uuid";

describe("hash", () => {
  it("simple hash for fixed partitions", () => {
    const partitionCount = 3;
    expect(
      getSimpleHash(partitionCount, "5da5ff34-2443-4263-a8af-fec64e8bdfa7")
    ).toBe(2);
    expect(
      getSimpleHash(partitionCount, "1557185d-937a-44b9-80f4-2e1e39dec0da")
    ).toBe(0);
    expect(
      getSimpleHash(partitionCount, "280a86ae-8513-437e-a781-6615027d6474")
    ).toBe(1);
  });
});

describe("consistent hash", () => {
  it("should be able to add and remove nodes", () => {
    let servers: Server[] = [];
    let keys: string[] = [];
    let ring = new Map<string, Server>();

    addServer({ id: uuid() }, servers, keys, ring);
    addServer({ id: uuid() }, servers, keys, ring);
    addServer({ id: uuid() }, servers, keys, ring);

    expect(servers.length).toBe(3);
    expect(keys.length).toBe(6);
    expect(ring.size).toBe(6);

    removeServer(servers[1], servers, keys, ring);
    expect(servers.length).toBe(2);
    expect(keys.length).toBe(4);
    expect(ring.size).toBe(4);
  });

  it("should send the same client to the same server every time", () => {
    let servers: Server[] = [];
    let keys: string[] = [];
    let ring = new Map<string, Server>();

    addServer({ id: uuid() }, servers, keys, ring);
    addServer({ id: uuid() }, servers, keys, ring);
    addServer({ id: uuid() }, servers, keys, ring);

    const client = "1c241205-bd3b-43c7-80a4-d42512516fd4";
    const c1Pass1 = getDestinationServer(client, keys, ring);
    const c1Pass2 = getDestinationServer(client, keys, ring);
    expect(c1Pass1).toBe(c1Pass2);

    const client2 = "6ba98103-de92-4388-8f05-617db1d3d856";
    const c2Pass1 = getDestinationServer(client2, keys, ring);
    const c2Pass2 = getDestinationServer(client2, keys, ring);
    expect(c2Pass1).toBe(c2Pass2);

    addServer({ id: uuid() }, servers, keys, ring);
    const c1Pass3 = getDestinationServer(client, keys, ring);
    const c2Pass3 = getDestinationServer(client2, keys, ring);
    expect(c1Pass1).toBe(c1Pass3);
    expect(c2Pass1).toBe(c2Pass3);

    removeServer(servers[2], servers, keys, ring);
    const c1Pass4 = getDestinationServer(client, keys, ring);
    const c2Pass4 = getDestinationServer(client2, keys, ring);
    expect(c1Pass1).toBe(c1Pass4);
    expect(c2Pass1).toBe(c2Pass4);
  });
});
