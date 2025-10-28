import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'block-preview-interface',
	name: 'Block Preview',
	icon: 'box',
	description: 'Preview landing page blocks while editing.',
	component: InterfaceComponent,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	autoKey: true,
	hideLabel: true,
	options: [
		{
			field: 'baseUrl',
			name: 'Base URL',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'full',
				options: {
					placeholder: 'http://localhost:3000'
				},
				note: 'Base URL for the preview. Defaults to http://localhost:3000 if not provided.'
			}
		},
		{
			field: 'startCollapsed',
			name: 'Start Collapsed',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				width: 'half',
				options: {
					label: 'Start with preview collapsed'
				},
				note: 'When enabled, the preview will be hidden by default and can be shown with a button.'
			},
			schema: {
				default_value: false
			}
		}
	],
});
