export type $primitives = {
	string: string;
	number: number;
	boolean: boolean;
	null: null;
};

export type Primitive = $primitives[keyof $primitives];

export type $types<
	Rest extends Partial<$primitives> = $primitives,
	Acc extends (keyof $primitives)[] = [],
> = keyof Rest extends never
	? []
	: {
			[K in keyof Rest]:
				| [...Acc, K]
				| [...Acc, K, ...$types<Omit<Rest, K>>];
		}[keyof Rest];

export function is_type<T extends $types>(
	types: T,
	val: unknown
): val is T[number] {
	if (val === null) {
		return (types as string[]).includes("null");
	}
	return (types as string[]).includes(typeof val);
}
