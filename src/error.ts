export class PackerError extends Error {
	constructor(
		message: string,
		public path: (string | number)[] = []
	) {
		super(message);
		this.name = "PackerError";
	}
}

export class PackError extends PackerError {
	constructor(message: string, path: (string | number)[] = []) {
		super(message, path);
		this.name = "PackError";
	}
}

export class UnpackError extends PackerError {
	constructor(message: string, path: (string | number)[] = []) {
		super(message, path);
		this.name = "UnpackError";
	}
}
