import { PackError, UnpackError } from "./error";
import {
	is_type,
	type $primitives,
	type $types,
	type Primitive
} from "./primitives";
import type { $known, $nullable, $prettify, $tuple } from "./types";

export const isPacker = Symbol("isPacker");

type $envelope<
	Keys extends string[],
	Shape extends Record<Keys[number], Packer<any, any>>
> = {
	[K in keyof Keys]: K extends keyof []
		? Keys[K]
		: Keys[K] extends keyof Shape
			? ReturnType<Shape[Keys[K]]["pack"]>
			: unknown;
};

type $data<
	Keys extends string[],
	Shape extends Record<Keys[number], Packer<any, any>>
> = $prettify<{
	[K in Keys[number]]: K extends keyof Shape
		? ReturnType<Shape[K]["unpack"]>
		: unknown;
}>;

type $versionedShape<
	Cases extends [version: Primitive, data: Packer<any, any>]
> = Cases extends [version: infer V, data: infer P extends Packer<any, any>]
	? { version: V; data: Shape<P> }
	: never;

type $versionedEnvelope<
	Cases extends [version: Primitive, data: Packer<any, any>]
> = Cases extends [version: infer V, data: infer P extends Packer<any, any>]
	? [version: V, envelope: Envelope<P>]
	: never;

export type Envelope<P extends Packer<any, any>> =
	P extends Packer<any, infer E> ? E : never;
export type Shape<P extends Packer<any, any>> =
	P extends Packer<infer D, any> ? D : never;

export interface Packer<Data, Envelope> {
	readonly [isPacker]: true;

	pack(value: Data, path?: (string | number)[]): Envelope;

	unpack(envolope: Envelope, path?: (string | number)[]): Data;
	unpack(envolope: unknown, path?: (string | number)[]): Data;

	$array(): ArrayPacker<this, number>;

	$array<Length extends number>(
		tuple: $known<Length>
	): ArrayPacker<this, Length>;

	$nullable(): Packer<Data | null, Envelope | null>;
	$nullable<N extends boolean>(
		nullable: $known<N, [boolean]>
	): Packer<$nullable<Data, N>, $nullable<Envelope, N>>;
}

export interface PrimitivePacker<Types extends $types> extends Packer<
	$primitives[Types[number]],
	$primitives[Types[number]]
> {}

export interface LiteralPacker<Value extends Primitive> extends Packer<
	Value,
	Value
> {
	$or<NewValue extends Primitive>(
		value: NewValue extends Value ? never : $known<NewValue>
	): LiteralPacker<Value | NewValue>;

	$nullable(): LiteralPacker<Value | null>;
	$nullable<N extends boolean>(
		nullable: $known<N, [boolean]>
	): LiteralPacker<$nullable<Value, N>>;
}

export interface ObjectPacker<
	Keys extends string[],
	Shape extends Record<string, Packer<any, any>> = {},
	Nullable extends boolean = false
> extends Packer<
	$nullable<$data<Keys, Shape>, Nullable>,
	$nullable<$envelope<Keys, Shape>, Nullable>
> {
	$shape<
		ExtendShape extends Record<
			Exclude<Keys[number], keyof Shape>,
			Packer<any, any>
		>
	>(
		shape: ExtendShape
	): ObjectPacker<Keys, Shape & ExtendShape, Nullable>;

	$shape<
		Key extends Exclude<string, Keys[number]>,
		P extends Packer<any, any>
	>(
		key: Key,
		packer: P
	): ObjectPacker<Keys, Shape & Record<Key, P>, Nullable>;
}

export interface ArrayPacker<
	Element extends Packer<any, any>,
	Length extends number = number,
	Nullable extends boolean = false
> extends Packer<
	$nullable<$tuple<Shape<Element>, Length>, Nullable>,
	$nullable<$tuple<Envelope<Element>, Length>, Nullable>
> {
	$tuple<NewLength extends number>(
		length: number extends NewLength ? never : NewLength
	): ArrayPacker<Element, NewLength, Nullable>;
}

export interface TuplePacker<
	Elements extends Packer<any, any>[],
	Nullable extends boolean = false
> extends Packer<
	$nullable<
		{
			[K in keyof Elements]: Elements[K] extends Packer<infer D, any>
				? D
				: Elements[K];
		},
		Nullable
	>,
	$nullable<
		{
			[K in keyof Elements]: Elements[K] extends Packer<any, infer E>
				? E
				: Elements[K];
		},
		Nullable
	>
> {}

export interface VersionedPacker<
	Cases extends [version: Primitive, data: Packer<any, any>],
	Nullable extends boolean = false
> extends Packer<
	$nullable<$versionedShape<Cases>, Nullable>,
	$nullable<$versionedEnvelope<Cases>, Nullable>
> {
	$case<C extends Primitive, P extends Packer<any, any>>(
		version: C extends Cases[0] ? never : $known<C>,
		packer: P
	): VersionedPacker<Cases | [version: C, data: P], Nullable>;
}

abstract class packer$ {
	get [isPacker]() {
		return true;
	}

	abstract pack(value: any, path?: (string | number)[]): any;
	abstract unpack(envolope: any, path?: (string | number)[]): any;

	$array(length?: number) {
		return new array$(this, length);
	}

	abstract $nullable(nullable?: boolean): packer$;
}

class primitive$ extends packer$ {
	#types: (keyof $primitives)[];

	constructor(types: (keyof $primitives)[]) {
		super();
		this.#types = types;
	}

	pack(value: Primitive, path: (string | number)[] = []): Primitive {
		if (!is_type(this.#types as any, value)) {
			throw new PackError(
				`Expected types ${this.#types.join(" | ")}, got ${value === null ? "null" : typeof value}`,
				path
			);
		}
		return value;
	}

	unpack(envolope: Primitive, path: (string | number)[] = []): Primitive {
		if (!is_type(this.#types as any, envolope)) {
			throw new PackError(
				`Expected types ${this.#types.join(" | ")}, got ${envolope === null ? "null" : typeof envolope}`,
				path
			);
		}
		return envolope;
	}

	$nullable(nullable: boolean = true) {
		if (this.#types.includes("null") && !nullable) {
			return new primitive$(this.#types.filter((t) => t !== "null"));
		}
		if (!this.#types.includes("null") && nullable) {
			return new primitive$([...this.#types, "null"]);
		}
		return this;
	}
}

class literal$ extends packer$ {
	#accepts: Set<Primitive>;
	#nullable: boolean;

	constructor(accepts: Set<Primitive>, nullable: boolean = false) {
		super();
		this.#accepts = accepts;
		this.#nullable = nullable;
		if (this.#accepts.has(null)) {
			this.#accepts.delete(null);
			this.#nullable = true;
		}
	}

	pack(value: Primitive, path: (string | number)[] = []): Primitive {
		if (!this.#accepts.has(value)) {
			throw new PackError(
				`Expected literal ${Array.from(this.#accepts)
					.map((v) => JSON.stringify(v))
					.join(" | ")}, got ${JSON.stringify(value)}`,
				path
			);
		}
		return value;
	}

	unpack(envolope: Primitive, path: (string | number)[] = []): Primitive {
		if (!this.#accepts.has(envolope)) {
			throw new UnpackError(
				`Expected literal ${Array.from(this.#accepts)
					.map((v) => JSON.stringify(v))
					.join(" | ")}, got ${JSON.stringify(envolope)}`,
				path
			);
		}
		return envolope;
	}

	$or(value: Primitive) {
		if (this.#accepts.has(value)) {
			return this;
		}
		return new literal$(new Set([...this.#accepts, value]), this.#nullable);
	}

	$nullable(nullable = true) {
		if (this.#nullable && !nullable) {
			return new literal$(this.#accepts, false);
		}
		if (!this.#nullable && nullable) {
			return new literal$(this.#accepts, true);
		}
		return this;
	}
}

class object$ extends packer$ {
	#keys: string[];
	#shape: Record<string, packer$>;
	#nullable: boolean;

	constructor(
		keys: string[],
		shape: Record<string, packer$> = {},
		nullable: boolean = false
	) {
		super();
		this.#keys = keys;
		this.#shape = shape;
		this.#nullable = nullable;
	}

	pack(value: any, path: (string | number)[] = []): any {
		if (value === null) {
			if (this.#nullable) {
				return null;
			}
			throw new PackError(`Expected object, got null`, path);
		}
		if (typeof value !== "object") {
			throw new PackError(`Expected object, got ${typeof value}`, path);
		}
		if (Array.isArray(value)) {
			throw new PackError(`Expected object, got array`, path);
		}
		return this.#keys.map((key) => {
			if (!(key in this.#shape)) {
				throw new PackError(
					`Shape for key ${JSON.stringify(key)} is not defined`,
					path
				);
			}
			return this.#shape[key]!.pack(value[key], [...path, key]);
		});
	}

	unpack(envolope: any, path: (string | number)[] = []): any {
		if (envolope === null) {
			if (this.#nullable) {
				return null;
			}
			throw new UnpackError(`Expected array, got null`, path);
		}
		if (!Array.isArray(envolope)) {
			throw new UnpackError(
				`Expected array, got ${typeof envolope}`,
				path
			);
		}
		if (envolope.length !== this.#keys.length) {
			throw new UnpackError(
				`Expected array of length ${this.#keys.length}, got length ${envolope.length}`,
				path
			);
		}
		return Object.fromEntries(
			this.#keys.map((key, index) => {
				if (!(key in this.#shape)) {
					throw new UnpackError(
						`Shape for key ${JSON.stringify(key)} is not defined`,
						path
					);
				}
				return [
					key,
					this.#shape[key]!.unpack(envolope[index], [...path, key])
				];
			})
		);
	}

	$nullable(nullable: boolean = true) {
		if (this.#nullable && !nullable) {
			return new object$(this.#keys, this.#shape, false);
		}
		if (!this.#nullable && nullable) {
			return new object$(this.#keys, this.#shape, true);
		}
		return this;
	}

	$shape(shape: Record<string, packer$> | string, packer?: packer$) {
		if (typeof shape === "string" && packer) {
			return new object$(
				this.#keys,
				{ ...this.#shape, [shape]: packer },
				this.#nullable
			);
		}
		return new object$(
			this.#keys,
			{ ...this.#shape, ...(shape as Record<string, packer$>) },
			this.#nullable
		);
	}
}

class array$ extends packer$ {
	#element: packer$;
	#length: number | undefined;
	#nullable: boolean;

	constructor(
		element: packer$,
		length: number | undefined = undefined,
		nullable: boolean = false
	) {
		super();
		this.#element = element;
		this.#length = length;
		this.#nullable = nullable;
	}

	pack(value: any, path: (string | number)[] = []): any {
		if (value === null) {
			if (this.#nullable) {
				return null;
			}
			throw new PackError(`Expected array, got null`, path);
		}
		if (!Array.isArray(value)) {
			throw new PackError(`Expected array, got ${typeof value}`, path);
		}
		if (this.#length !== undefined && value.length !== this.#length) {
			throw new PackError(
				`Expected array of length ${this.#length}, got length ${value.length}`,
				path
			);
		}
		return value.map((item, index) =>
			this.#element.pack(item, [...path, index])
		);
	}

	unpack(envolope: any, path: (string | number)[] = []): any {
		if (envolope === null) {
			if (this.#nullable) {
				return null;
			}
			throw new UnpackError(`Expected array, got null`, path);
		}
		if (!Array.isArray(envolope)) {
			throw new UnpackError(
				`Expected array, got ${typeof envolope}`,
				path
			);
		}
		if (this.#length !== undefined && envolope.length !== this.#length) {
			throw new UnpackError(
				`Expected array of length ${this.#length}, got length ${envolope.length}`,
				path
			);
		}
		return envolope.map((item, index) =>
			this.#element.unpack(item, [...path, index])
		);
	}

	$nullable(nullable: boolean = true) {
		if (this.#nullable && !nullable) {
			return new array$(this.#element, this.#length, false);
		}
		if (!this.#nullable && nullable) {
			return new array$(this.#element, this.#length, true);
		}
		return this;
	}

	$tuple(length: number) {
		return new array$(this.#element, length, this.#nullable);
	}
}

class tuple$ extends packer$ {
	#elements: packer$[];
	#nullable: boolean;

	constructor(elements: packer$[], nullable: boolean = false) {
		super();
		this.#elements = elements;
		this.#nullable = nullable;
	}

	pack(value: any, path: (string | number)[] = []): any {
		if (value === null) {
			if (this.#nullable) {
				return null;
			}
			throw new PackError(`Expected tuple, got null`, path);
		}
		if (!Array.isArray(value)) {
			throw new PackError(`Expected tuple, got ${typeof value}`, path);
		}
		if (value.length !== this.#elements.length) {
			throw new PackError(
				`Expected tuple of length ${this.#elements.length}, got length ${value.length}`,
				path
			);
		}
		return value.map((item, index) =>
			this.#elements[index]!.pack(item, [...path, index])
		);
	}

	unpack(envolope: any, path: (string | number)[] = []): any {
		if (envolope === null) {
			if (this.#nullable) {
				return null;
			}
			throw new UnpackError(`Expected tuple, got null`, path);
		}
		if (!Array.isArray(envolope)) {
			throw new UnpackError(
				`Expected tuple, got ${typeof envolope}`,
				path
			);
		}
		if (envolope.length !== this.#elements.length) {
			throw new UnpackError(
				`Expected tuple of length ${this.#elements.length}, got length ${envolope.length}`,
				path
			);
		}
		return envolope.map((item, index) =>
			this.#elements[index]!.unpack(item, [...path, index])
		);
	}

	$nullable(nullable: boolean = true) {
		if (this.#nullable && !nullable) {
			return new tuple$(this.#elements, false);
		}
		if (!this.#nullable && nullable) {
			return new tuple$(this.#elements, true);
		}
		return this;
	}
}

class versioned$ extends packer$ {
	#versions: Map<Primitive, packer$>;
	#nullable: boolean;

	constructor(versions: Map<Primitive, packer$>, nullable: boolean = false) {
		super();
		this.#versions = versions;
		this.#nullable = nullable;
	}

	pack(value: any, path: (string | number)[] = []): any {
		if (value === null) {
			if (this.#nullable) {
				return null;
			}
			throw new PackError(`Expected object, got null`, path);
		}
		if (typeof value !== "object") {
			throw new PackError(`Expected object, got ${typeof value}`, path);
		}
		if (Array.isArray(value)) {
			throw new PackError(`Expected object, got array`, path);
		}
		if (!("version" in value)) {
			throw new PackError(`Missing version field`, path);
		}
		const version = value["version"];
		if (!this.#versions.has(version)) {
			throw new PackError(
				`Unknown version ${JSON.stringify(version)}`,
				path
			);
		}
		const packer = this.#versions.get(version)!;
		return [version, packer.pack(value["data"], [...path, "data"])];
	}

	unpack(envolope: any, path: (string | number)[] = []): any {
		if (envolope === null) {
			if (this.#nullable) {
				return null;
			}
			throw new UnpackError(`Expected array, got null`, path);
		}
		if (!Array.isArray(envolope) || envolope.length !== 2) {
			throw new UnpackError(
				`Expected array of [version, envelope], got ${typeof envolope}`,
				path
			);
		}
		const [version, envelope] = envolope;
		if (!this.#versions.has(version)) {
			throw new UnpackError(
				`Unknown version ${JSON.stringify(version)}`,
				path
			);
		}
		const packer = this.#versions.get(version)!;
		return {
			version,
			data: packer.unpack(envelope, [...path, "data"])
		};
	}

	$nullable(nullable: boolean = true) {
		if (this.#nullable && !nullable) {
			return new versioned$(this.#versions, false);
		}
		if (!this.#nullable && nullable) {
			return new versioned$(this.#versions, true);
		}
		return this;
	}

	$case<C extends Primitive, P extends packer$>(version: C, packer: P) {
		if (this.#versions.has(version)) {
			throw new Error(
				`Version ${JSON.stringify(version)} already exists`
			);
		}
		const newVersions = new Map(this.#versions);
		newVersions.set(version, packer);
		return new versioned$(newVersions, this.#nullable);
	}
}

export function primitive<Types extends $types>(
	...types: Types
): PrimitivePacker<Types> {
	return new primitive$(types) as any;
}

export function literal<Value extends Primitive>(
	value: $known<Value>
): LiteralPacker<Value> {
	return new literal$(new Set([value])) as any;
}

export function object<Keys extends string[]>(
	...keys: Keys
): ObjectPacker<Keys, {}, false> {
	return new object$(keys) as any;
}

export function versioned(): VersionedPacker<never, false> {
	return new versioned$(new Map()) as any;
}
