import { createHash } from "crypto";

export type Server = {
  id: string;
};

const hash = (key: string, algorithm: string): string => {
  return createHash(algorithm).update(key).digest("hex");
};

const getKeyHash = (server: Server, replica: number): string => {
  return hash(server.id + "-" + replica, "md5");
};

export const addServer = (
  server: Server,
  servers: Server[],
  keys: string[],
  ring: Map<string, Server>,
  replicas = 2
): { servers: Server[]; keys: string[]; ring: Map<string, Server> } => {
  servers.push(server); // add node to nodes array
  for (let replica = 0; replica < replicas; replica++) {
    const key = getKeyHash(server, replica);
    keys.push(key);
    ring.set(key, server);
  }

  keys.sort();

  return { servers, keys, ring };
};

export const removeServer = (
  server: Server,
  servers: Server[],
  keys: string[],
  ring: Map<string, Server>,
  replicas = 2
): { servers: Server[]; keys: string[]; ring: Map<string, Server> } => {
  for (let nodeIndex = 0; nodeIndex < servers.length; nodeIndex++) {
    if (servers[nodeIndex] == server) {
      servers.splice(nodeIndex, 1);
      nodeIndex--; // have to do this since are mutating in place
    }
  }

  for (let replica = 0; replica < replicas; replica++) {
    const key = getKeyHash(server, replica);
    ring.delete(key);
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
      if (keys[keyIndex] == key) {
        keys.splice(keyIndex, 1);
        keyIndex--; // have to do this since are mutating in place
      }
    }
  }

  return { servers, keys, ring };
};

export const getDestinationServer = (
  client: string,
  keys: string[],
  ring: Map<string, Server>
): Server | undefined => {
  const clientHash = hash(client, "md5");

  let upper = keys.length - 1;
  let lower = 0;
  let idx = 0;
  let comp = 0;
  while (lower <= upper) {
    idx = Math.floor((lower + upper) / 2); // midway point
    comp = clientHash > keys[idx] ? -1 : clientHash < keys[idx] ? 1 : 0;
    if (comp == 0) {
      upper = idx;
      break;
    } else if (comp > 0) {
      lower = idx + 1;
    } else {
      upper = idx - 1;
    }
  }

  if (upper < 0) {
    upper = keys.length - 1;
  }

  return ring.get(keys[upper]);
};

// class Consistent_hashing {
//     constructor(
//       nodes,
//       replicas = 4,
//       algorithm = "md5",
//       add_note_dynamically_time = 2000
//     ) {
//       this.replicas = replicas;
//       this.algorithm = algorithm;
//       this.ring = {};
//       this.keys = [];
//       this.nodes = [];

//       for (let i = 0; i < nodes.length; i++) {
//         setTimeout(() => {
//           this.addNode(nodes[i]);
//         }, add_note_dynamically_time * i);
//       }
//     }
//     addNode(node) {
//       this.nodes.push(node);

//       for (let i = 0; i < this.replicas; i++) {
//         const key = this.crypto((node.id || node) + ":" + i);

//         this.keys.push(key);
//         this.ring[key] = node;
//       }

//       this.keys.sort();
//     }
//     removeNode(node) {
//       for (let i = 0; i < this.nodes.length; i++) {
//         if (this.nodes[i] == node) {
//           this.nodes.splice(i, 1);
//           i--;
//         }
//       }

//       for (let i = 0; i < this.replicas; i++) {
//         const key = this.crypto((node.id || node) + ":" + i);
//         delete this.ring[key];

//         for (let j = 0; j < this.keys.length; j++) {
//           if (this.keys[j] == key) {
//             this.keys.splice(j, 1);
//             j--;
//           }
//         }
//       }
//     }
//     getNode(key) {
//       if (this.getRingLength() == 0) return 0;

//       const hash = this.crypto(key); //get hash of data/key
//       const pos = this.getNodePosition(hash);

//       return this.ring[this.keys[pos]];
//     }
//     getNodePosition(hash) {
//       //simple binary searching as keys.sort[] was sorted so it will
//       //searching on basis on javascript string comparison

//       let upper = this.getRingLength() - 1;
//       let lower = 0;
//       let idx = 0;
//       let comp = 0;

//       if (upper == 0) return 0;

//       while (lower <= upper) {
//         idx = Math.floor((lower + upper) / 2);
//         comp = this.compare(this.keys[idx], hash);

//         if (comp == 0) {
//           //if got exact match return pos
//           return idx;
//         } else if (comp > 0) {
//           upper = idx - 1;
//         } else {
//           lower = idx + 1;
//         }
//       }

//       //upper will always be in range between (lower-upper)
//       //if upper get less than lower, attach data to last node then
//       if (upper < 0) {
//         upper = this.getRingLength() - 1;
//       }

//       return upper;
//     }
//     getRingLength() {
//       return Object.keys(this.ring).length;
//     }
//     compare(v1, v2) {
//       //simple string comparison of hash
//       return v1 > v2 ? 1 : v1 < v2 ? -1 : 0;
//     }
//     crypto(str) {
//       return crypto.createHash(this.algorithm).update(str).digest("hex");
//     }
//   }
