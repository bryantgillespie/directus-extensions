
<script setup lang="ts">
import ReadOnlyHtml from './read-only-html.vue';
import { computed } from 'vue';
import { useStores } from '@directus/extensions-sdk';
import { Field } from '@directus/types';

const props = defineProps<{
	field: Field;
	type: string;
    disabled: boolean;
	interface: string;
	collection: string;
	options: Record<string, any>;
	value: string | number | boolean | object | null;
}>();

const emit = defineEmits<{
	(e: 'input', value: string | number | boolean | object | null): void;
}>();

console.log('props', props);

const { useFieldsStore, usePermissionsStore } = useStores();
const fieldsStore = useFieldsStore();
const { hasPermission } = usePermissionsStore();

const canEdit = computed(() => {
	const edit = hasPermission(props.collection, 'update');
    return edit;
});
</script>


<template>
	<div :class="[disabled ? 'top-border' : '']">
        <component :key="`field-${field}`" :value="value" @input="emit('input', $event)" :is="`interface-${interface}`" v-if="!disabled" v-bind="options" />
        <v-icon v-else-if="interface === 'select-icon' && value" :name="value" x-large />
        <read-only-html v-else class="readonly-html selectable" :content="value" />
    </div>
</template>

<style scoped>
.readonly-html {
	max-width: 100%;
	overflow-x: auto;
}

.top-border {
    border-top: var(--theme--border-width) solid var(--theme--border-color);
}
</style>
