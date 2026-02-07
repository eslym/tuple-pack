import { literal, primitive, object, tuple, versioned } from "./packer";
import { PackerError, PackError, UnpackError } from "./error";

export const packer = {
	literal,
	primitive,
	object,
	tuple,
	versioned,
	PackerError,
	PackError,
	UnpackError
};

export default packer;

export {
	literal,
	primitive,
	object,
	tuple,
	versioned,
	PackerError,
	PackError,
	UnpackError
};

export type { Shape, Envelope } from "./packer";
