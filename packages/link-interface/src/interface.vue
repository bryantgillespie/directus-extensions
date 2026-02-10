<script setup lang="ts">
import { computed } from 'vue';
import CollectionSearchCombobox from './CollectionSearchCombobox.vue';

interface PageEntity {
	id: string;
	title: string;
	permalink: string;
}

interface PostEntity {
	id: string;
	title: string;
	slug: string;
	image?: string; // Optional: post might not have featured image
	summary?: string; // Optional: might not have excerpt
}

interface ProductEntity {
	id: string;
	name: string; // API uses 'name' not 'title'
	slug: string;
	image?: string;
	summary?: string;
}

type LinkEntity = PageEntity | PostEntity | ProductEntity;

export type LinkData =
	| { type: 'page'; entity: PageEntity; label?: string; open_in_new_tab?: boolean }
	| { type: 'post'; entity: PostEntity; label?: string; open_in_new_tab?: boolean }
	| { type: 'product'; entity: ProductEntity; label?: string; open_in_new_tab?: boolean }
	| { type: 'url'; url: string; label?: string; open_in_new_tab?: boolean }
	| { type: 'page' | 'post' | 'product'; label?: string; open_in_new_tab?: boolean }; // No entity selected yet

interface TypeConfig {
	text: string;
	value: 'page' | 'post' | 'product' | 'url';
	icon: string;
	collection?: string;
	fields?: string[];
	sortField?: string;
	titleField: string; // Field name in API response
	imageField?: string;
	iconFallback?: string;
	secondaryField?: string;
}

const props = withDefaults(defineProps<LinkInterfaceProps>(), {
	value: null,
	disabled: false,
	defaultType: 'page',
	enabledTypes: () => [],
	showLabel: true,
	showOpenInNewTab: true,
	urlPlaceholder: 'Enter relative (/page) or absolute (https://example.com) URL',
});

const emit = defineEmits(['input']);

const TYPE_CONFIGS: Record<string, TypeConfig> = {
	page: {
		text: 'Page',
		value: 'page',
		icon: 'description',
		collection: 'pages',
		fields: ['id', 'title', 'permalink'],
		sortField: 'title',
		titleField: 'title',
		secondaryField: 'permalink',
	},
	post: {
		text: 'Post',
		value: 'post',
		icon: 'article',
		collection: 'posts',
		fields: ['id', 'title', 'slug', 'image', 'summary'],
		sortField: 'title',
		titleField: 'title',
		imageField: 'image',
		iconFallback: 'article',
		secondaryField: 'slug',
	},
	product: {
		text: 'Product',
		value: 'product',
		icon: 'inventory_2',
		collection: 'products',
		fields: ['id', 'name', 'slug', 'image', 'summary'],
		sortField: 'name',
		titleField: 'name', // Products use 'name' instead of 'title'
		imageField: 'image',
		iconFallback: 'inventory_2',
		secondaryField: 'slug',
	},
	url: {
		text: 'URL',
		value: 'url',
		icon: 'link',
		titleField: 'url',
	},
} as const;

export interface LinkInterfaceProps {
	value?: LinkData | null;
	disabled?: boolean;
	defaultType?: 'page' | 'post' | 'product' | 'url';
	enabledTypes?: string[];
	showLabel?: boolean;
	showOpenInNewTab?: boolean;
	urlPlaceholder?: string;
}

function isValidType(type: string): type is keyof typeof TYPE_CONFIGS {
	return type in TYPE_CONFIGS;
}

const currentConfig = computed(() => {
	const type = linkData.value.type;

	if (!isValidType(type)) {
		console.warn(`Invalid link type: ${type}. Falling back to default.`);
		return TYPE_CONFIGS[props.defaultType];
	}

	return TYPE_CONFIGS[type];
});

const availableLinkTypes = computed(() => {
	const allTypes = Object.values(TYPE_CONFIGS);
	if (!props.enabledTypes?.length) return allTypes;

	// Validate enabled types
	const validTypes = new Set(props.enabledTypes.filter((type) => {
		if (!isValidType(type)) {
			console.warn(`Invalid enabled type: ${type}`);
			return false;
		}

		return true;
	}));

	return allTypes.filter((type) => validTypes.has(type.value));
});

const selectedItem = computed(() => {
	const data = linkData.value;
	if (data.type === 'url' || !('entity' in data)) return null;
	return data.entity;
});

function createDefaultValue(type: 'page' | 'post' | 'product' | 'url'): LinkData {
	if (type === 'url') {
		return { type: 'url', url: '', label: '', open_in_new_tab: false };
	}

	return { type, label: '', open_in_new_tab: false } as LinkData;
}

const linkData = computed<LinkData>({
	get() {
		return props.value ?? createDefaultValue(props.defaultType);
	},
	set(newValue) {
		emit('input', newValue);
	},
});

function updateType(newType: LinkData['type']) {
	linkData.value = {
		type: newType,
		label: linkData.value.label,
		open_in_new_tab: linkData.value.open_in_new_tab,
		...(newType === 'url' ? { url: '' } : {}),
	} as LinkData;
}

function updateLabel(newLabel: string) {
	linkData.value = { ...linkData.value, label: newLabel };
}

function updateOpenInNewTab(newValue: boolean) {
	linkData.value = { ...linkData.value, open_in_new_tab: newValue };
}

function updateUrl(newUrl: string) {
	if (linkData.value.type === 'url') {
		linkData.value = { ...linkData.value, url: newUrl };
	}
}

function itemToString(item: any): string {
	if (!item) return '';
	return item.title || item.name || '';
}

function handleSelection(item: any) {
	const currentType = linkData.value.type;

	if (!item) {
		linkData.value = {
			type: currentType,
			label: linkData.value.label,
			open_in_new_tab: linkData.value.open_in_new_tab,
		} as LinkData;

		return;
	}

	if (currentType === 'url') return;

	linkData.value = {
		type: currentType,
		entity: item as LinkEntity,
		label: linkData.value.label,
		open_in_new_tab: linkData.value.open_in_new_tab,
	} as LinkData;
}
</script>

<template>
	<div class="link-interface">
		<!-- Type and Search/URL Row -->
		<div class="flex-row">
			<div class="type-section">
				<div class="field-label">
					Type
				</div>
				<v-select
					:model-value="linkData.type"
					:items="availableLinkTypes"
					:disabled="disabled"
					placeholder="Select link type..."
					item-icon="icon"
					@update:model-value="updateType"
				/>
			</div>

			<!-- Collection Search (page, post, product) -->
			<div v-if="linkData.type !== 'url'" class="search-section">
				<div class="field-label">
					{{ currentConfig?.text }}
				</div>
				<CollectionSearchCombobox
					:model-value="selectedItem"
					:collection="currentConfig?.collection"
					:fields="currentConfig?.fields"
					:sort="currentConfig?.sortField ? [currentConfig.sortField] : undefined"
					:item-to-string="itemToString"
					:image-field="currentConfig?.imageField"
					:icon-fallback="currentConfig?.iconFallback"
					:secondary-field="currentConfig?.secondaryField"
					tertiary-field="summary"
					:placeholder="`Select ${linkData.type}...`"
					:disabled="disabled"
					@update:model-value="handleSelection"
				/>
			</div>

			<!-- URL Input -->
			<div v-else class="url-section">
				<div class="field-label">
					URL
				</div>
				<v-input
					:model-value="linkData.url || ''"
					:placeholder="urlPlaceholder"
					:disabled="disabled"
					@update:model-value="updateUrl"
				>
					<template #prepend>
						<v-icon name="link" />
					</template>
				</v-input>
			</div>
		</div>

		<!-- Label and New Tab Row -->
		<div class="flex-row align-center">
			<div v-if="showLabel" class="field-row flex-1">
				<div class="field-label">
					Label
				</div>
				<v-input
					:model-value="linkData.label || ''"
					placeholder="Link text (optional)"
					:disabled="disabled"
					@update:model-value="updateLabel"
				>
					<template #prepend>
						<v-icon name="label" />
					</template>
				</v-input>
			</div>
			<div v-if="showOpenInNewTab" class="checkbox-container">
				<v-checkbox
					:model-value="linkData.open_in_new_tab || false"
					:disabled="disabled"
					label="Open in New Tab"
					@update:model-value="updateOpenInNewTab"
				/>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.link-interface {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: var(--theme--form--row-gap);
}

.field-row {
	display: flex;
	flex-direction: column;
}

.flex-1 {
	flex: 1;
}

.field-label {
	position: relative;
	display: flex;
	margin-block-end: 2px;
	color: var(--theme--form--field--label--foreground);
	font-weight: 600;
	font-size: 14px;
}

.flex-row {
	display: flex;
	gap: var(--theme--form--column-gap);
}

.align-center {
	align-items: center;
}

.type-section {
	flex: 0 0 200px;
	display: flex;
	flex-direction: column;
}

.search-section,
.url-section {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.checkbox-container {
	display: flex;
	align-items: center;
	flex-shrink: 0;
}
</style>
