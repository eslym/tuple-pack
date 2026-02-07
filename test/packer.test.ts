/// <reference types="@types/bun" />
import { describe, expect, it } from "bun:test";
import {
	PackError,
	UnpackError,
	any,
	literal,
	object,
	primitive,
	tuple,
	versioned
} from "../src/index";

describe("primitive packer", () => {
	it("packs and unpacks allowed primitives", () => {
		const packer = primitive("number", "string");
		expect(packer.pack(42)).toBe(42);
		expect(packer.unpack("ok")).toBe("ok");
	});

	it("throws PackError with path for invalid type", () => {
		const packer = primitive("number");
		try {
			packer.pack("nope" as unknown as number, ["value"]);
			throw new Error("Expected PackError");
		} catch (error) {
			expect(error).toBeInstanceOf(PackError);
			expect((error as PackError).path).toEqual(["value"]);
		}
	});
});

describe("literal packer", () => {
	it("accepts configured literals", () => {
		const packer = literal("active").$or("disabled");
		expect(packer.pack("active")).toBe("active");
		expect(packer.unpack("disabled")).toBe("disabled");
	});

	it("throws UnpackError for unexpected literal", () => {
		const packer = literal("active");
		try {
			packer.unpack("inactive" as any, ["status"]);
			throw new Error("Expected UnpackError");
		} catch (error) {
			expect(error).toBeInstanceOf(UnpackError);
			expect((error as UnpackError).path).toEqual(["status"]);
		}
	});
});

describe("object packer", () => {
	it("packs and unpacks object shape", () => {
		const user = object("id", "name").$shape({
			id: primitive("number"),
			name: primitive("string")
		});
		const packed = user.pack({ id: 1, name: "Ada" });
		expect(packed).toEqual([1, "Ada"]);
		const unpacked = user.unpack([2, "Bob"]);
		expect(unpacked).toEqual({ id: 2, name: "Bob" });
	});

	it("threads paths for nested failures", () => {
		const user = object("id", "name").$shape({
			id: primitive("number"),
			name: primitive("string")
		});
		try {
			user.pack({ id: 1, name: 123 } as any);
			throw new Error("Expected PackError");
		} catch (error) {
			expect(error).toBeInstanceOf(PackError);
			expect((error as PackError).path).toEqual(["name"]);
		}
	});
});

describe("array packer", () => {
	it("enforces array length when configured", () => {
		const pair = primitive("number").$array(2);
		expect(pair.pack([1, 2])).toEqual([1, 2]);
		try {
			pair.pack([1] as any);
			throw new Error("Expected PackError");
		} catch (error) {
			expect(error).toBeInstanceOf(PackError);
		}
	});

	it("annotates index paths on failures", () => {
		const nums = primitive("number").$array();
		try {
			nums.pack([1, "x"] as any);
			throw new Error("Expected PackError");
		} catch (error) {
			expect(error).toBeInstanceOf(PackError);
			expect((error as PackError).path).toEqual([1]);
		}
	});
});

describe("tuple packer", () => {
	it("packs and unpacks tuples", () => {
		const packer = tuple(primitive("string"), primitive("number"));
		expect(packer.pack(["ok", 3])).toEqual(["ok", 3]);
		expect(packer.unpack(["hi", 4])).toEqual(["hi", 4]);
	});

	it("rejects length mismatches", () => {
		const packer = tuple(primitive("string"), primitive("number"));
		try {
			packer.pack(["only"] as any);
			throw new Error("Expected PackError");
		} catch (error) {
			expect(error).toBeInstanceOf(PackError);
		}
	});
});

describe("versioned packer", () => {
	it("packs and unpacks by version", () => {
		const payload = versioned().$case(
			1,
			object("value").$shape({ value: primitive("string") })
		);
		const packed = payload.pack({ version: 1, data: { value: "ok" } });
		expect(packed).toEqual([1, ["ok"]]);
		const unpacked = payload.unpack([1, ["ok"]]);
		expect(unpacked).toEqual({ version: 1, data: { value: "ok" } });
	});

	it("throws on unknown versions", () => {
		const payload = versioned().$case(
			1,
			object("value").$shape({ value: primitive("string") })
		);
		try {
			payload.unpack([2, ["ok"]]);
			throw new Error("Expected UnpackError");
		} catch (error) {
			expect(error).toBeInstanceOf(UnpackError);
		}
	});
});

describe("any packer", () => {
	it("passes values through without validation", () => {
		const packer = any<{ value: number }>();
		const value = { value: 42 };
		expect(packer.pack(value)).toBe(value);
		expect(packer.unpack(value)).toBe(value);
	});

	it("respects non-nullable mode", () => {
		const packer = any();
		try {
			packer.pack(null);
			throw new Error("Expected PackError");
		} catch (error) {
			expect(error).toBeInstanceOf(PackError);
		}
		try {
			packer.unpack(null);
			throw new Error("Expected UnpackError");
		} catch (error) {
			expect(error).toBeInstanceOf(UnpackError);
		}
	});
});
