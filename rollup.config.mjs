import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const input = "src/index.ts";
const external = [];

export default [
	{
		input,
		external,
		output: [
			{
				file: "dist/index.js",
				format: "es",
				sourcemap: true
			},
			{
				file: "dist/index.cjs",
				format: "cjs",
				exports: "named",
				sourcemap: true
			}
		],
		plugins: [
			typescript({
				tsconfig: "./tsconfig.build.json"
			})
		]
	},
	{
		input,
		external,
		output: {
			file: "dist/index.d.ts",
			format: "es"
		},
		plugins: [
			dts({
				tsconfig: "./tsconfig.build.json"
			})
		]
	}
];
