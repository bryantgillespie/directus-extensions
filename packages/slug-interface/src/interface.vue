<script setup lang="ts">
import type { PropType } from 'vue';
import slugify from '@sindresorhus/slugify';
import { render } from 'micromustache';
import { computed, inject, nextTick, ref, useAttrs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
	primaryKey: {
		type: [Number, String],
		required: true,
	},
	field: {
		type: String,
		required: true,
	},
	value: {
		type: String,
		default: null,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	placeholder: {
		type: String,
		default: null,
	},
	template: {
		type: String,
		default: '',
		required: true,
	},
	separator: {
		type: String,
		default: '-',
	},
	preserveCharacters: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
	prefix: {
		type: String,
		default: '',
	},
	suffix: {
		type: String,
		default: '',
	},
	iconLeft: {
		type: String,
		default: null,
	},
	update: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
	length: {
		type: Number,
		default: null,
	},
	autofocus: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['input']);

const attrs = useAttrs();
const { t } = useI18n();
const values = inject('values', ref<Record<string, any>>({}));
const isEditing = ref<boolean>(props.autofocus);
const isTouched = ref<boolean>(false);

const slugSafeCharacters = computed(() =>
	[...'abcdefghijklmnopqrstuvwxyz0123456789-_~ ', ...props.preserveCharacters],
);

const isDiffer = computed<boolean>(() => {
	const transformed = transform(render(props.template, values.value));
	if (transformed === (props.value || '')) return false;
	return transformed !== (props.value || '').replace(/-\d+$/, '');
});

const presentedLink = computed(() => {
	const prefix = typeof props.prefix === 'string' ? render(props.prefix, values.value) : '';
	const suffix = typeof props.suffix === 'string' ? render(props.suffix, values.value) : '';
	const middlePart = props.value || props.placeholder || (attrs['field-data']?.meta.field as string) || '';

	return prefix + middlePart + suffix;
});

function onKeyDown(event: KeyboardEvent) {
	const key = event.key?.toLowerCase();
	if (!key) return;

	if (key === 'enter') {
		event.preventDefault();
		disableEdit();
	}

	const target = event.target as HTMLInputElement;

	const isAllowed =
		slugSafeCharacters.value.includes(key)
		|| ['backspace', 'delete', 'tab', 'escape', 'enter', 'home', 'end', 'pageup', 'pagedown'].includes(key)
		|| key.startsWith('arrow');

	if (!isAllowed) {
		event.preventDefault();
		return;
	}

	// Handle space key press
	if (key === ' ') {
		event.preventDefault();

		const cursorPosition = target.selectionStart || 0;
		const newValue = target.value.slice(0, cursorPosition) + props.separator + target.value.slice(cursorPosition);

		// Emit the new value with the separator
		emit('input', transform(newValue));

		// Update the input field and move the cursor to the correct position after the separator is added
		nextTick(() => {
			target.value = newValue;
			target.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
		});
	}
}

function onChange(value: string) {
	if (props.disabled || !value) return;

	// Replace spaces with separator
	const valueWithSeparators = value.replaceAll(/\s+/g, props.separator);

	const transformedValue = transform(valueWithSeparators);

	if (props.value !== transformedValue) {
		emit('input', transformedValue);
	}
}

function transform(value: string) {
	if (!value) return '';

	const preserveRegex = new RegExp(`[${props.preserveCharacters.join('')}]`, 'g');
	const preserved = value.match(preserveRegex) || [];
	const parts = value.split(preserveRegex);

	const slugifiedParts = parts.map((part) =>
		slugify(part, {
			separator: props.separator,
			lowercase: true,
		}),
	);

	let result = slugifiedParts.reduce((acc, part, index) => acc + part + (preserved[index] || ''), '');

	result = result
		.replaceAll(new RegExp(`^${props.separator}+|${props.separator}+$`, 'g'), '')
		.replaceAll(new RegExp(`${props.separator}{2,}`, 'g'), props.separator);

	return result.slice(0, props.length);
}

function setByCurrentState() {
	isTouched.value = false;
	emitter(values.value);
}

function enableEdit() {
	isEditing.value = true;
}

function disableEdit() {
	isEditing.value = false;
}

function emitter(values: Record<string, any>) {
	const newValue = transform(render(props.template, values));
	if (newValue === (props.value || '')) return;

	emit('input', newValue);
}

watch(values, (values: Record<string, any>) => {
	// Reject manual touching.
	if (isEditing.value || isTouched.value) return;

	// According the update policy.
	if (!(props.primaryKey !== '+' ? props.update.includes('update') : props.update.includes('create'))) return;

	// Avoid self update.
	if (values[props.field] && (values[props.field] || '') !== (props.value || '')) return;

	emitter(values);
});
</script>

<template>
	<v-input
		v-if="isEditing && !disabled"
		autofocus
		:model-value="value"
		:placeholder="placeholder"
		:disabled="disabled"
		@update:model-value="onChange"
		@blur="disableEdit"
		@keydown="onKeyDown"
	>
		<template v-if="iconLeft || prefix" #prepend>
			<v-icon v-if="iconLeft" :name="iconLeft" />
			<span v-if="prefix" class="prefix">{{ prefix }}</span>
		</template>
		<template v-if="suffix" #append>
			<span class="suffix">{{ suffix }}</span>
		</template>
	</v-input>
	<div v-else class="link-preview-mode">
		<v-icon v-if="iconLeft" :name="iconLeft" class="icon-left" />
		<span class="link" @click="!disabled && enableEdit">{{ presentedLink }}</span>

		<v-button v-if="!disabled" v-tooltip="t('edit')" x-small secondary icon class="action-button" @click="enableEdit">
			<v-icon name="edit" />
		</v-button>

		<v-button
			v-if="isDiffer && !isTouched"
			v-tooltip="t('auto_generate')"
			x-small
			secondary
			icon
			class="action-button"
			@click="setByCurrentState"
		>
			<v-icon name="auto_fix_high" />
		</v-button>
	</div>
</template>

<style scoped>
.link-preview-mode {
	display: flex;
	align-items: center;
	min-height: var(--theme--form--field--input--height);
}

.action-button {
	margin-left: 8px;
}

.icon-left {
	margin-right: 8px;
}

.link {
	color: var(--theme--foreground-subdued);
	text-decoration: underline;
	word-break: break-word;
	cursor: pointer;
}

.prefix,
.suffix {
	color: var(--theme--foreground-subdued);
}
</style>
