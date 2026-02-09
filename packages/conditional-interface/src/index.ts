import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'conditional-interface',
	name: 'Conditional Interface',
	icon: 'box',
	description: 'This is my custom interface!',
	component: InterfaceComponent,
	options: ({ collection }) => {
		return [

			{
				name: '$t:type',
				field: 'type',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					sort: 4,
					options: {
						choices: [
							{
								text: '$t:string',
								value: 'string',
							},
							{
								text: '$t:text',
								value: 'text',
							},
							{ divider: true },
							{
								text: '$t:boolean',
								value: 'boolean',
							},
							{ divider: true },
							{
								text: '$t:integer',
								value: 'integer',
							},
							{
								text: '$t:bigInteger',
								value: 'bigInteger',
							},
							{
								text: '$t:float',
								value: 'float',
							},
							{
								text: '$t:decimal',
								value: 'decimal',
							},
							{ divider: true },
							{
								text: '$t:geometry.All',
								value: 'geometry',
							},
							{ divider: true },
							{
								text: '$t:timestamp',
								value: 'timestamp',
							},
							{
								text: '$t:datetime',
								value: 'dateTime',
							},
							{
								text: '$t:date',
								value: 'date',
							},
							{
								text: '$t:time',
								value: 'time',
							},
							{ divider: true },
							{
								text: '$t:json',
								value: 'json',
							},
							{
								text: '$t:csv',
								value: 'csv',
							},
							{
								text: '$t:uuid',
								value: 'uuid',
							},
							{
								text: '$t:hash',
								value: 'hash',
							},
						],
					},
				},
			},

			{
				name: '$t:interfaces.list.interface_group',
				field: 'group-interface',
				type: 'alias',
				meta: {
					interface: 'group-detail',
					field: 'group-interface',
					width: 'full',
					sort: 7,
					options: {
						start: 'open',
					},
					collection,
					special: ['group', 'no-data', 'alias'],
				},
			},
			{
				name: '$t:interface_label',
				field: 'interface',
				type: 'string',
				meta: {
					interface: 'system-interface',
					width: 'half',
					sort: 8,
					group: 'group-interface',
					options: {
						typeField: 'type',
					},
				},
			},
			{
				name: '$t:interface_options',
				field: 'options',
				type: 'string',
				meta: {
					interface: 'system-interface-options',
					width: 'full',
					sort: 9,
					group: 'group-interface',
					options: {
						interfaceField: 'interface',
					},
				},
			},
			{
				name: '$t:interfaces.list.display_group',
				field: 'group-display',
				type: 'alias',
				meta: {
					interface: 'group-detail',
					field: 'group-display',
					width: 'full',
					sort: 10,
					options: {
						start: 'closed',
					},
					collection,
					special: ['group', 'no-data', 'alias'],
				},
			},
			{
				name: '$t:display_label',
				field: 'display',
				type: 'string',
				meta: {
					interface: 'system-display',
					width: 'half',
					group: 'group-display',
					sort: 11,
					options: {
						typeField: 'type',
					},
				},
			},
			{
				name: '$t:display_options',
				field: 'display_options',
				type: 'string',
				meta: {
					interface: 'system-display-options',
					width: 'full',
					group: 'group-display',
					sort: 12,
					options: {
						displayField: 'display',
					},
				},
			},
		];
	},
	types: ['string', 'text', 'json'],
});
