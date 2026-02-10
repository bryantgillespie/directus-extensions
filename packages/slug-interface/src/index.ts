import { defineInterface } from '@directus/extensions-sdk';
import InterfaceSlug from './interface.vue';

export default defineInterface({
	id: 'slug-interface',
	name: 'Slug',
	description: 'Slug/permalink interface',
	icon: 'link',
	component: InterfaceSlug,
	types: ['string'],
	group: 'standard',
	options: ({ collection }) => {
		return [
			{
				field: 'placeholder',
				name: '$t:placeholder',
				meta: {
					width: 'full',
					interface: 'input',
					options: {

						placeholder: '$t:enter_a_placeholder',
					},
					note: 'This is the text that will be displayed in the field when it is empty.',
				},
			},
			{
				field: 'template',
				type: 'string',
				name: '$t:template',
				meta: {
					width: 'full',
					interface: 'system-display-template',
					required: true,
					options: {
						collectionName: collection,
						font: 'monospace',
						placeholder: '{{ title }}-{{ id }}',
					},
					note: 'The slug will be generated based on this template. You can use any field from the collection.',
				},
			},
			{
				field: 'separator',
				name: '$t:separator',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',

					required: true,
					options: {
						choices: [
							{ text: 'underscore(_)', value: '_' },
							{ text: 'dash (-)', value: '-' },
							{ text: 'empty string ("")', value: '' },
							{ text: 'custom', value: 'custom' },
						],
					},
					note: 'The separator will be used to separate the words in the slug.',
				},
				schema: {
					default_value: '-',
				},
			},
			{
				field: 'customSeparator',
				name: '$t:custom_separator',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'input',
					hidden: true,
					conditions: [
						{
							hidden: false,
							rule: {
								separator: { _eq: 'custom' },
							},
						},
					],
					note: 'The custom separator will be used to separate the words in the slug.',
				},
			},
			{
				field: 'preserveCharacters',
				name: '$t:preserve_characters',
				type: 'json',
				meta: {
					width: 'half',
					interface: 'tags',
					note: 'The characters that will be preserved in the slug. For example if you are using permalinks you might want to preserve the forward slashes `(/).`',
				},
				schema: {
					default_value: [],
				},
			},
			{
				field: 'iconLeft',
				name: '$t:icon_left',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
					note: 'The icon that will be displayed on the left side of the slug.',
				},
			},
			{
				field: 'prefix',
				type: 'string',
				name: '$t:prefix',
				meta: {
					width: 'full',
					interface: 'system-display-template',
					options: {
						collectionName: collection,
						font: 'monospace',
						placeholder: 'http://example.com/',
					},
					note: 'The prefix will be displayed before the slug.',
				},
			},
			{
				field: 'suffix',
				type: 'string',
				name: '$t:suffix',
				meta: {
					width: 'full',
					interface: 'system-display-template',
					options: {
						collectionName: collection,
						font: 'monospace',
						placeholder: '/',
					},
					note: 'The suffix will be displayed after the slug.',
				},
			},
			{
				field: 'update',
				name: '$t:auto_generate',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'select-multiple-checkbox',
					options: {
						choices: [
							{ text: '$t:on_create', value: 'create' },
							{ text: '$t:on_update', value: 'update' },
						],
					},
					note: 'These options enables/disables the automatic update based on content change.The slug will be automatically generated when the record is created or updated.',
				},
				schema: {
					default_value: ['create'],
				},
			},
		];
	},
});
