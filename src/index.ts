import {
	literal,
	primitive,
	object,
	tuple,
	versioned,
	any,
	isPacker
} from "./packer";
import { PackerError, PackError, UnpackError } from "./error";

export const packer = {
	literal,
	primitive,
	object,
	tuple,
	versioned,
	any,
	PackerError,
	PackError,
	UnpackError,
	isPacker
};

export default packer;

export {
	literal,
	primitive,
	object,
	tuple,
	versioned,
	any,
	PackerError,
	PackError,
	UnpackError
};

export { isPacker } from "./packer";

export type { Shape, Envelope } from "./packer";
