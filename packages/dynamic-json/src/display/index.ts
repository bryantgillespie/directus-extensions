import { defineDisplay } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';

export default defineDisplay({
	id: 'dynamic_json_display',
	name: 'Dynamic JSON Display',
	icon: 'file_json',
	description: 'Display JSON data with modal viewer',
	component: DisplayComponent,
	options: [
		{
			field: 'defaultView',
			name: 'Default View',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Formatted', value: 'formatted', icon: 'article' },
						{ text: 'Tree', value: 'tree', icon: 'code_blocks' },
					],
				},
			},
			schema: {
				default_value: 'formatted',
			},
		},
		{
			field: 'maxHeight',
			name: 'Max Height (px)',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'No limit', value: null },
						{ text: '400px', value: 400 },
						{ text: '600px', value: 600 },
						{ text: '800px', value: 800 },
						{ text: '1000px', value: 1000 },
					],
					allowOther: true,
				},
			},
			schema: {
				default_value: 600,
			},
		},
		{
			name: 'Tree View Theme',
			field: 'divider-meta',
			type: 'alias',
			meta: {
				interface: 'presentation-divider',
				width: 'full',
				options: {
					icon: 'code_blocks',
					title: 'Tree View Theme',
					inlineTitle: true,
				},
			},
		},
		{
			field: 'colorKey',
			name: 'Key Color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
				note: 'Color for keys and section headers in both views',
			},
			schema: {
				default_value: null,
			},
		},
		{
			field: 'colorString',
			name: 'String Color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
				note: 'Color for string values in tree view',
			},
			schema: {
				default_value: '#22863a',
			},
		},
		{
			field: 'colorNumber',
			name: 'Number Color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
				note: 'Color for number values in tree view',
			},
			schema: {
				default_value: '#005cc5',
			},
		},
		{
			field: 'colorBoolean',
			name: 'Boolean Color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
				note: 'Color for boolean values in tree view',
			},
			schema: {
				default_value: '#6f42c1',
			},
		},
		{
			field: 'colorNull',
			name: 'Null Color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
				note: 'Color for null values in tree view',
			},
			schema: {
				default_value: null,
			},
		},
		{
			field: 'initialTreeDepth',
			name: 'Initial Tree Expansion Depth',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '2',
				},
			},
			schema: {
				default_value: 2,
			},
		},
	],
	types: ['json'],
});
