<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { DeepPartial, Field, FieldMeta } from '@directus/types';
import { computed, ref, toRefs } from 'vue';

const props = withDefaults(
	defineProps<{
		value: Record<string, unknown>[] | null;
		fields?: DeepPartial<Field>[];
		template?: string;
		addLabel?: string;
		sort?: string;
		limit?: number;
		disabled?: boolean;
		headerPlaceholder?: string;
		collection?: string;
		placeholder?: string;
		direction?: string;
	}>(),
	{
		fields: () => [],
	}
);

const emit = defineEmits<{
	(e: 'input', value: FieldMeta[] | null): void;
}>();

const { value } = toRefs(props);

const validationErrors = ref<any[]>([]);

const templateWithDefaults = computed(() =>
	props.fields?.[0]?.field ? props.template || `{{${props.fields[0].field}}}` : ''
);

const isSaveDisabled = computed(() => {
	for (const field of props.fields) {
		if (
			field.meta?.required &&
			field.field &&
			(value.value[field.field] === null || value.value[field.field] === undefined)
		) {
			return true;
		}
	}

	return false;
});

const defaults = computed(() => {
	const values: Record<string, any> = {};

	for (const field of props.fields) {
		if (field.schema?.default_value !== undefined && field.schema?.default_value !== null) {
			values[field.field!] = field.schema.default_value;
		}
	}

	return values;
});

const fieldsWithNames = computed(() =>
	props.fields?.map((field) => {
		return {
			...field,
			name: formatTitle(field.name ?? field.field!),
			meta: {
                interface: field.interface,
				width: field.width,
                options: field.options,
			},
		};
	})
);
</script>

<template>
    <!-- <pre>{{ fieldsWithNames }}</pre> -->
	<v-form
		:disabled="disabled"
		:fields="fieldsWithNames"
		:model-value="value"
		:direction="direction"
		@update:model-value="$emit('input', $event)"
		:validation-errors="validationErrors"
	/>
</template>

<style scoped>
.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
