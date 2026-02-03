export type $prettify<T extends {}> = {
	[K in keyof T]: T[K];
} & {};

export type $nullable<T, N extends boolean> = N extends true
	? Exclude<T, null> | null
	: Exclude<T, null>;

export type $tuple<
	Element,
	Length extends number,
	Acc extends Element[] = []
> = number extends Length
	? Element[]
	: Acc["length"] extends Length
		? Acc
		: $tuple<Element, Length, [...Acc, Element]>;

export type $predicate = (val: unknown) => boolean;

export type $known<
	T,
	Guard extends any[] = [
		string,
		boolean,
		number,
		null,
		undefined,
		bigint,
		symbol
	]
> = T extends null
	? null extends Guard[number]
		? null
		: never
	: {
			[K in keyof Guard]: Guard[K] extends T
				? never
				: T extends Guard[K]
					? T
					: never;
		}[number];

export type $remove<T extends any[], U, Acc extends any[] = []> = T extends [
	infer First,
	...infer Rest
]
	? First extends U
		? $remove<Rest, U, Acc>
		: $remove<Rest, U, [...Acc, First]>
	: Acc;
