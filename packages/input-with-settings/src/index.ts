import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';
import options from './options.vue';

export default defineInterface({
	id: 'input-with-settings',
	name: 'Input with Settings',
	icon: 'input',
	description: 'Text input with settings menu for metadata like heading levels - stores as JSON (not searchable)',
	component: InterfaceComponent,
	options,
	types: ['json'],
	group: 'standard',
});
