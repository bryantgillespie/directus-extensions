import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'link-interface',
	name: 'Smart Link',
	icon: 'link',
	description: 'Dynamic link interface that adapts based on link type (Page, Post, Product, or URL)',
	component: InterfaceComponent,
	options: [
		{
			field: 'defaultType',
			name: 'Default Link Type',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				note: 'The default link type when creating new links.',
				options: {
					choices: [
						{ text: 'Page', value: 'page' },
						{ text: 'Post', value: 'post' },
						{ text: 'Product', value: 'product' },
						{ text: 'URL', value: 'url' },
					],
				},
			},
			schema: {
				default_value: 'page',
			},
		},
		{
			field: 'enabledTypes',
			name: 'Enabled Link Types',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'select-multiple-checkbox',
				note: 'Which link types to allow. Leave empty to enable all types.',
				options: {
					choices: [
						{ text: 'Page', value: 'page' },
						{ text: 'Post', value: 'post' },
						{ text: 'Product', value: 'product' },
						{ text: 'URL', value: 'url' },
					],
				},
			},
			schema: {
				default_value: null,
			},
		},
		{
			field: 'showLabel',
			name: 'Show Label Field',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				note: 'Whether to show the label input field.',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'showOpenInNewTab',
			name: 'Show "Open in New Tab" Option',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				note: 'Whether to show the "Open in New Tab" checkbox.',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'urlPlaceholder',
			name: 'URL Placeholder Text',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				note: 'Placeholder text for the URL input field.',
			},
			schema: {
				default_value: 'Enter relative (/page) or absolute (https://example.com) URL',
			},
		},
	],
	types: ['json'],
});
