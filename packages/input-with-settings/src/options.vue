<script setup lang="ts">
import type { Field } from '@directus/types';
import { computed, ref, watch } from 'vue';

type FlexibleField = Partial<Field> & {
	field: string;
	name: string;
	meta: {
		interface: string;
		width?: string;
		note?: string;
		options?: Record<string, any>;
	};
};

const props = defineProps<{
	value: Record<string, any>;
}>();

const emit = defineEmits(['input']);

const formValues = ref({ ...props.value });

const staticFields: FlexibleField[] = [
	{
		field: 'placeholder',
		name: 'Placeholder',
		type: 'string',
		meta: {
			interface: 'input',
			width: 'full',
			note: 'Enter a placeholder for the main input field',
		},
	},
	{
		field: 'contentKey',
		name: 'Content Key',
		type: 'string',
		meta: {
			interface: 'input',
			width: 'half',
			note: 'Key for the main input value in the stored object',
			options: {
				placeholder: 'content',
			},
		},
	},
	{
		field: 'settingsTooltip',
		name: 'Settings Tooltip',
		type: 'string',
		meta: {
			interface: 'input',
			width: 'half',
			note: 'Tooltip text for the settings icon',
			options: {
				placeholder: 'Settings',
			},
		},
	},
];

const dynamicFields = computed(() => {
	const fields: FlexibleField[] = [
		{
			field: 'settingsOptions',
			name: 'Settings Options',
			type: 'json',
			meta: {
				interface: 'list',
				width: 'full',
				note: 'Configure options for the settings dropdown',
				options: {
					template: '{{ label }}',
					fields: [
						{
							field: 'key',
							name: 'Option Key',
							type: 'string',
							meta: {
								interface: 'input',
								width: 'half',
							},
						},
						{
							field: 'label',
							name: 'Option Label',
							type: 'string',
							meta: {
								interface: 'input',
								width: 'half',
							},
						},
						{
							field: 'icon',
							name: 'Option Icon',
							type: 'string',
							meta: {
								interface: 'select-icon',
								width: 'half',
								note: 'Icon name for the option',
							},
						},
						{
							field: 'defaultValue',
							name: 'Default Value',
							type: 'string',
							meta: {
								interface: 'input',
								width: 'half',
								note: 'Default value for the option',
							},
						},
						{
							field: 'choices',
							name: 'Choices',
							type: 'json',
							meta: {
								interface: 'list',
								width: 'full',
								options: {
									template: '{{ text }}',
									fields: [
										{
											field: 'value',
											name: 'Value',
											type: 'string',
											meta: {
												interface: 'input',
												width: 'half',
											},
										},
										{
											field: 'text',
											name: 'Text',
											type: 'string',
											meta: {
												interface: 'input',
												width: 'half',
											},
										},
										{
											field: 'icon',
											name: 'Icon',
											type: 'string',
											meta: {
												interface: 'select-icon',
												width: 'half',
												note: 'Icon name for the choice',
											},
										},
									],
								},
							},
						},
					],
				},
			},
		},
	];

	return fields;
});

const allFields = computed(() => {
	return [...staticFields, ...dynamicFields.value];
});

watch(formValues, (newValues) => {
	emit('input', newValues);
}, { deep: true });

watch(() => props.value, (newValue) => {
	if (newValue && JSON.stringify(newValue) !== JSON.stringify(formValues.value)) {
		formValues.value = { ...newValue };
	}
}, { deep: true });
</script>

<template>
	<div>
		<v-form
			key="super-input-interface"
			v-model="formValues"
			:fields="allFields"
			primary-key="+"
		/>
	</div>
</template>
