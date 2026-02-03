# @eslym/tuple-pack

Typed tuple packing utilities for compact, versionable envelopes. Build packers for primitives, literals, objects, arrays, tuples, and versioned payloads, then `pack` to an array-based envelope and `unpack` back to typed data.

## Purpose

This library is for defining stable, compact wire formats for network transfer (for example, over WebSocket). It converts object-shaped data into tuple envelopes (arrays) to reduce payload size, and lets you evolve schemas safely through versioned packers while keeping runtime validation.

## Install

```bash
bun add @eslym/tuple-pack
```

## Usage

```ts
import { object, primitive, literal, versioned } from "@eslym/tuple-pack";

const user = object("id", "name").$shape({
	id: primitive("number"),
	name: primitive("string")
});

const status = literal("active").$or("disabled");

const payload = versioned()
	.$case(1, object("user", "status").$shape({ user, status }))
	.$case(2, object("user").$shape({ user }));

const packed = payload.pack({
	version: 1,
	data: { user: { id: 1, name: "Ada" }, status: "active" }
});
// packed = [1, [ [1, "Ada"], "active" ] ]

const unpacked = payload.unpack(packed);
// unpacked = { version: 1, data: { user: { id: 1, name: "Ada" }, status: "active" } }
```

## API

```ts
primitive(...types);
literal(value);
object(...keys);
versioned();
```

Packers expose:

```ts
pack(value, path?)
unpack(envelope, path?)
$nullable(nullable?)
$array(length?)
```

Additional helpers:

- `LiteralPacker.$or(value)`
- `ObjectPacker.$shape(shape | key, packer?)`
- `ArrayPacker.$tuple(length)`
- `VersionedPacker.$case(version, packer)`

## Build

```bash
bun run build
```

## License

MIT
