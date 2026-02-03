import { literal, primitive, object, versioned } from "./packer";
import { PackerError, PackError, UnpackError } from "./error";

export const packer = {
	literal,
	primitive,
	object,
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
	versioned,
	PackerError,
	PackError,
	UnpackError
};

export type { Shape, Envelope } from "./packer";
