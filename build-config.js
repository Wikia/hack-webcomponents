import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
// import jsx from 'rollup-plugin-jsx';
import jsx from 'babel-plugin-transform-react-jsx';
import nodeResolve from 'rollup-plugin-node-resolve';
import presetEs2015 from 'babel-preset-es2015-rollup';
import presetStage0 from 'babel-preset-stage-0';
// import uglify from 'rollup-plugin-uglify';

export default {
	dest: 'dist/global-navigation.js',
	entry: 'scripts/global-navigation.js',
	format: 'amd',
	moduleId: 'global-navigation',
	plugins: [
		babel({
			plugins: [
				[
					jsx,
					{
						pragma: 'skate.h'
					}
				]
			],
			presets: [
				presetEs2015,
				presetStage0
			],
			runtimeHelpers: true
		}),
		commonjs({
			// include: 'node_modules/**',
			namedExports: {
				'incremental-dom': ['applyProp', 'attributes', 'elementClose', 'elementOpen'],
				'node_modules/incremental-dom/dist/incremental-dom-cjs.js': ['applyProp', 'attributes', 'elementClose', 'elementOpen'],
			}
		}),
		filesize(),
		// jsx({
		// 	factory: 'skate.h'
		// }),
		nodeResolve({
			jsnext: true
		}),
		// uglify()
	]
};
