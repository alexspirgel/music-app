import {defineConfig} from 'vite';
import react, {reactCompilerPreset} from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import path from 'path'

export default defineConfig({
	server: {
    port: 5000, // Set dev server to run on port 3000
    strictPort: true // Force Vite to exit if the port is already in use
  },
  preview: {
    port: 5001, // Set production preview server to run on port 8080
    strictPort: true // Force Vite to exit if the port is already in use
  },
	plugins: [
		react(),
		babel({
			presets: [reactCompilerPreset()]
		}),
	],
	resolve: {
		alias: {
			'@src': path.resolve(__dirname, './src'),
			'@assets': path.resolve(__dirname, './src/assets'),
			'@components': path.resolve(__dirname, './src/components'),
			'@styles': path.resolve(__dirname, './src/styles'),
			'@controller': path.resolve(__dirname, '../../controller'),
			'@controller-types': path.resolve(__dirname, '../../controller/types'),
			'@controller-classes': path.resolve(__dirname, '../../controller/classes'),
		},
	},
});