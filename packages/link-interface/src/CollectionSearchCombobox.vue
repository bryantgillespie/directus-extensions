<script setup lang="ts">
import { useApi, useStores } from '@directus/extensions-sdk';
import { useDebounceFn } from '@vueuse/core';
import {
	ComboboxAnchor,
	ComboboxCancel,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxRoot,
	ComboboxTrigger,
} from 'reka-ui';
/**
 * CollectionSearchCombobox - Generic searchable combobox component
 *
 * This component supports both prop-based rendering (easy mode) and custom slots (full control).
 *
 * EASY MODE - Use props for common cases:
 * <CollectionSearchCombobox
 *   collection="products"
 *   :fields="['id', 'name', 'image', 'summary']"
 *   image-field="image"
 *   icon-fallback="inventory_2"
 *   secondary-field="slug"
 *   tertiary-field="summary"
 *   :item-to-string="item => item.name"
 * />
 *
 * CUSTOM SLOTS - Full control over item rendering:
 * <CollectionSearchCombobox collection="users" :fields="['id', 'name', 'email', 'avatar']">
 *   <template #item="{ item }">
 *     <div class="custom-layout">
 *       <img :src="item.avatar" />
 *       <div>
 *         <h4>{{ item.name }}</h4>
 *         <p>{{ item.email }}</p>
 *       </div>
 *     </div>
 *   </template>
 * </CollectionSearchCombobox>
 *
 * BEHAVIOR PROPS (inspired by Nuxt UI):
 * - resetSearchTermOnBlur (default: true) - Clear search when dropdown closes
 * - resetSearchTermOnSelect (default: true) - Clear search when item selected
 *
 * The component will use your custom slot if provided, otherwise falls back to prop-based rendering.
 */
import { computed, ref, watch } from 'vue';

interface Props {
	// Current selection (any shape)
	modelValue?: any | null;

	// Data source - ONE of these
	collection?: string;
	staticItems?: any[];

	// Collection mode fields
	fields?: string[];
	filter?: Record<string, any>;
	sort?: string[];
	limit?: number;

	// Transform functions
	itemToString?: (item: any) => string;
	itemToValue?: (item: any) => any;

	// Behavior
	disabled?: boolean;
	placeholder?: string;
	searchable?: boolean;
	clearable?: boolean;
	resetSearchTermOnBlur?: boolean;
	resetSearchTermOnSelect?: boolean;

	// Rich display helpers (for default rendering)
	imageField?: string;
	iconFallback?: string;
	secondaryField?: string;
	tertiaryField?: string; // e.g., summary, description
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	limit: 25,
	searchable: true,
	clearable: true,
	disabled: false,
	placeholder: 'Select...',
	resetSearchTermOnBlur: true,
	resetSearchTermOnSelect: true,
});

const emit = defineEmits<{
	'update:modelValue': [value: any | null];
}>();

const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const api = useApi();

// Internal state
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const isSearching = ref(false);
const comboboxOpen = ref(false);
const abortController = ref<AbortController | null>(null);

// Mode detection
const isCollectionMode = computed(() => !!props.collection);
const isStaticMode = computed(() => !!props.staticItems);

// Default transform functions
const defaultItemToString = (item: any): string => {
	if (!item) return '';
	if (typeof item === 'string') return item;

	if (typeof item === 'object') {
		// Try common label fields
		return item.label || item.name || item.title || item.text || String(item.value || item.id || '');
	}

	return String(item);
};

const defaultItemToValue = (item: any): any => {
	if (!item) return null;

	if (typeof item === 'object') {
		return item.value !== undefined ? item.value : (item.id !== undefined ? item.id : item);
	}

	return item;
};

// Use provided transform functions or defaults
const getItemString = computed(() => props.itemToString || defaultItemToString);
const getItemValue = computed(() => props.itemToValue || defaultItemToValue);

// Display value for trigger
const displayValue = computed(() => {
	if (!props.modelValue) return '';
	return getItemString.value(props.modelValue);
});

// Compare items for selection
function isSameItem(item1: any, item2: any): boolean {
	if (item1 === item2) return true;
	if (!item1 || !item2) return false;

	const value1 = getItemValue.value(item1);
	const value2 = getItemValue.value(item2);

	return value1 === value2;
}

// Selected item for combobox (needs to match from results)
const selectedItem = computed(() => {
	if (!props.modelValue) return null;

	// Try to find matching item in results
	const match = searchResults.value.find((item) => isSameItem(item, props.modelValue));
	return match || props.modelValue;
});

// Static items filtering (client-side)
function filterStaticItems(query: string) {
	if (!props.staticItems) return [];

	if (!query.trim()) {
		return props.staticItems;
	}

	const lowerQuery = query.toLowerCase();
	return props.staticItems.filter((item) => {
		const itemString = getItemString.value(item).toLowerCase();
		return itemString.includes(lowerQuery);
	});
}

// Collection search (server-side)
async function searchCollection(query: string) {
	if (!props.collection) {
		searchResults.value = [];
		return;
	}

	// Cancel previous request
	if (abortController.value) {
		abortController.value.abort();
	}

	abortController.value = new AbortController();

	isSearching.value = true;

	try {
		const params: any = {
			fields: props.fields?.join(',') || '*',
			limit: props.limit,
		};

		// Add search query if provided
		if (query.trim()) {
			params.search = query;
		}

		// Add filter if provided
		if (props.filter) {
			params.filter = props.filter;
		}

		// Add sort if provided
		if (props.sort && props.sort.length > 0) {
			params.sort = props.sort.join(',');
		}

		const response = await api.get(`/items/${props.collection}`, {
			params,
			signal: abortController.value.signal,
		});

		searchResults.value = response.data.data || [];
	}
	catch (error: any) {
		if (error.name === 'AbortError') {
			// Request was cancelled, ignore
			return;
		}

		console.error('Collection search error:', error);

		notificationsStore.add({
			title: 'Search Error',
			text: `Failed to search ${props.collection}`,
			type: 'danger',
		});

		searchResults.value = [];
	}
	finally {
		isSearching.value = false;
	}
}

// Unified search function
async function performSearch(query: string) {
	if (isStaticMode.value) {
		searchResults.value = filterStaticItems(query);
	}
	else if (isCollectionMode.value) {
		await searchCollection(query);
	}
}

// Debounced search
const debouncedSearch = useDebounceFn(performSearch, 300);

// Handle selection
function handleSelection(item: any) {
	if (!item) {
		emit('update:modelValue', null);
		return;
	}

	emit('update:modelValue', item);
	// Note: searchQuery reset is now handled by reka-ui via resetSearchTermOnSelect prop
	comboboxOpen.value = false;
}

// Clear selection
function clearSelection() {
	emit('update:modelValue', null);
	comboboxOpen.value = false;
}

// Watch search query
watch(searchQuery, (newQuery) => {
	if (comboboxOpen.value) {
		debouncedSearch(newQuery);
	}
});

// Watch combobox open/close
watch(comboboxOpen, (isOpen) => {
	if (isOpen // Only load if we don't have results yet
		&& searchResults.value.length === 0) {
		performSearch('');
	}
	// Note: searchQuery reset on close is now handled by reka-ui via resetSearchTermOnBlur prop
});

// Watch for collection/staticItems changes - clear results so they reload on next open
watch(() => props.collection, () => {
	searchResults.value = [];
});

watch(() => props.staticItems, () => {
	if (isCollectionMode.value) {
		// If we switched from static to collection mode, clear results
		searchResults.value = [];
	}
});

// Initialize on mount if static items
watch(() => props.staticItems, (items) => {
	if (isStaticMode.value && items) {
		searchResults.value = items;
	}
}, { immediate: true });
</script>

<template>
	<ComboboxRoot
		v-model:open="comboboxOpen"
		v-model:model-value="selectedItem"
		v-model:search-term="searchQuery"
		:reset-search-term-on-blur="resetSearchTermOnBlur"
		:reset-search-term-on-select="resetSearchTermOnSelect"
		ignore-filter
		class="combobox-root"
		@update:model-value="handleSelection"
	>
		<ComboboxAnchor as-child>
			<ComboboxTrigger :disabled="disabled" class="combobox-trigger-button" tabindex="0">
				<span class="trigger-content">
					<span v-if="selectedItem" class="selected-value">
						{{ displayValue }}
					</span>
					<span v-else class="placeholder">
						{{ placeholder }}
					</span>
				</span>

				<span class="trigger-trailing">
					<button
						v-if="clearable && selectedItem"
						class="clear-button"
						type="button"
						:disabled="disabled"
						@click.stop="clearSelection"
					>
						<v-icon name="close" />
					</button>
					<v-icon name="expand_more" class="chevron-icon" />
				</span>
			</ComboboxTrigger>
		</ComboboxAnchor>

		<ComboboxContent v-if="comboboxOpen" position="popper" class="combobox-content">
			<div v-if="searchable" class="search-container">
				<div class="search-input-wrapper">
					<ComboboxInput
						v-model="searchQuery"
						placeholder="Search..."
						class="combobox-search-input"
						autofocus
						@keydown.escape.stop="comboboxOpen = false"
					/>
					<v-icon name="search" class="search-icon" />
				</div>
			</div>

			<div v-if="isSearching" class="combobox-loading">
				<v-progress-circular small indeterminate />
				<span>Searching...</span>
			</div>

			<div v-else-if="searchResults.length === 0 && !isSearching" class="combobox-empty">
				No results found
			</div>

			<ComboboxItem
				v-for="(item, index) in searchResults"
				:key="getItemValue(item) || index"
				:value="item"
				class="combobox-item"
			>
				<slot name="item" :item="item">
					<div class="item-content">
						<!-- Image if imageField is provided and exists -->
						<div v-if="imageField && item[imageField]" class="item-image">
							<img
								:src="`/assets/${item[imageField]}?width=40&height=40&fit=cover&quality=80`"
								:alt="getItemString(item)"
								class="item-thumbnail"
							>
						</div>

						<!-- Icon fallback if iconFallback is provided and no image -->
						<div v-else-if="iconFallback && !(imageField && item[imageField])" class="item-icon">
							<v-icon :name="iconFallback" />
						</div>

						<!-- Content -->
						<div
							class="item-details"
							:class="{
								'no-image': !imageField && !iconFallback,
							}"
						>
							<div class="item-header">
								<span class="item-title">
									{{ getItemString(item) }}
								</span>
								<span v-if="secondaryField && item[secondaryField]" class="item-secondary">
									{{ secondaryField === 'slug' ? '/' : '' }}{{ item[secondaryField] }}
								</span>
							</div>
							<div v-if="tertiaryField && item[tertiaryField]" class="item-tertiary">
								{{ item[tertiaryField] }}
							</div>
						</div>
					</div>
				</slot>
			</ComboboxItem>

			<ComboboxCancel
				v-if="clearable && selectedItem"
				class="combobox-clear"
				@click="clearSelection"
			>
				<v-icon name="clear" />
				Clear selection
			</ComboboxCancel>
		</ComboboxContent>
	</ComboboxRoot>
</template>

<style lang="scss" scoped>
/* Combobox styles matching Directus design */
.combobox-root {
	position: relative;
	width: 100%;
}

.combobox-anchor {
	display: block;
	width: 100%;
}

.combobox-trigger-button {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: var(--theme--form--field--input--height);
	padding: 0 12px;
	background: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	color: var(--theme--form--field--input--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	cursor: pointer;
	transition: border-color var(--fast) var(--transition);
	text-align: left;

	&:hover:not(:disabled) {
		border-color: var(--theme--form--field--input--border-color-hover, var(--theme--primary));
	}

	&:focus,
	&:focus-visible {
		border-color: var(--theme--primary);
		outline: none !important;
		outline-offset: 0 !important;
		box-shadow: 0 0 0 2px var(--theme--primary-25);
	}

	&:disabled {
		background: var(--theme--form--field--input--background-subdued);
		color: var(--theme--form--field--input--foreground-subdued);
		cursor: not-allowed;
	}
}

/* Override global focus-visible rule specifically for this button */
.combobox-trigger-button:focus-visible {
	outline: none !important;
	outline-offset: 0 !important;
}

.trigger-content {
	display: flex;
	align-items: center;
	min-width: 0;
	flex: 1;
}

.selected-value {
	color: var(--theme--form--field--input--foreground);
	font-weight: 500;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}

.placeholder {
	color: var(--theme--form--field--input--foreground-subdued);
}

.trigger-trailing {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}

.clear-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--theme--form--field--input--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover:not(:disabled) {
		color: var(--theme--danger);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
}

.chevron-icon {
	color: var(--theme--form--field--input--foreground-subdued);
	transition: transform var(--fast) var(--transition);
}

:deep(.combobox-content),
.combobox-content {
	z-index: 600;
	max-height: 300px;
	overflow-y: auto;
	background: var(--theme--popover--menu--background);
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);
	margin: 0;
	padding: 0;
	width: var(--reka-combobox-trigger-width);
	transform: translateZ(0);
	will-change: transform;
}

.search-container {
	padding: 8px;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.search-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
}

.combobox-search-input {
	flex: 1;
	height: 36px;
	padding: 8px 40px 8px 12px;
	background: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	color: var(--theme--form--field--input--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	font-size: 14px;

	&:focus {
		border-color: var(--theme--primary);
		outline: none;
	}

	&::placeholder {
		color: var(--theme--form--field--input--foreground-subdued);
	}
}

.search-icon {
	position: absolute;
	right: 12px;
	color: var(--theme--form--field--input--foreground-subdued);
	pointer-events: none;
	width: 16px;
}

.combobox-loading,
.combobox-empty {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	color: var(--theme--foreground-subdued);
	font-size: 14px;
}

.combobox-item {
	position: relative;
	display: flex;
	align-items: center;
	min-height: 32px;
	margin: 2px 8px;
	padding: 4px 8px;
	cursor: pointer;
	color: var(--theme--foreground);
	text-align: start;
	border-radius: var(--theme--border-radius);
	background-color: transparent;
	transition: var(--fast) var(--transition);
	transition-property: background-color, color;

	&:hover,
	&[data-highlighted] {
		background-color: var(--theme--background-subdued);
	}

	&:first-child {
		margin-top: 8px;
	}

	&:last-child {
		margin-bottom: 8px;
	}

	/* Extra padding for posts and products with images/summaries */
	&:has(.item-image),
	&:has(.item-icon) {
		padding: 10px 12px;
		min-height: 60px;
	}
}

.item-content {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	min-width: 0;
}

.item-content:has(.no-image) {
	gap: 0;
}

.item-image {
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	border-radius: var(--theme--border-radius);
	overflow: hidden;
	background: var(--theme--background-accent);
}

.item-thumbnail {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.item-icon {
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--theme--background-accent);
	border-radius: var(--theme--border-radius);
	color: var(--theme--primary);
}

.item-details {
	flex: 1;
	min-width: 0; /* Allow text to truncate */
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.item-details.no-image {
	margin-left: 0;
}

.item-header {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.item-title {
	font-weight: 600;
	color: var(--theme--foreground);
	flex-shrink: 0;
}

.item-secondary {
	font-size: 12px;
	color: var(--theme--primary);
	font-family: var(--theme--fonts--monospace--font-family);
	flex-shrink: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-tertiary {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 1;
	line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.combobox-clear {
	position: relative;
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 32px;
	margin: 2px 8px 8px 8px;
	padding: 0 8px;
	background: transparent;
	border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	color: var(--theme--foreground-subdued);
	transition: var(--fast) var(--transition);
	transition-property: background-color, color;
	font-size: 13px;

	&:hover {
		color: var(--theme--danger);
		background-color: var(--theme--background-subdued);
	}
}

/* Checkbox container styling */
.checkbox-container {
	display: flex;
	align-items: center;
	flex-shrink: 0;
}
</style>
