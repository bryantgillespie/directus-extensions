<script lang="ts" setup>
import formatTitle from '@directus/format-title';
import { AccordionContent, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isEmail, isUrl } from './utils';

defineOptions({
	name: 'FormattedView',
});

const props = defineProps<{
	value: Record<string, any>;
	depth?: number;
	colorKey?: string | null;
	onExpandCollapseUpdate?: (fns: {
		expandAll: () => void;
		collapseAll: () => void;
		allExpanded: boolean;
		allCollapsed: boolean;
	}) => void;
}>();

const currentDepth = props.depth ?? 0;

const { t } = useI18n();

// Apply custom key color if provided
const containerStyle = computed(() => {
	const style: Record<string, string> = {};

	if (props.colorKey) {
		style['--color-key'] = props.colorKey;
	}

	return style;
});

// Copy functionality
const copiedKey = ref<string | null>(null);

async function copyToClipboard(key: string, value: any) {
	try {
		const textToCopy = typeof value === 'object' && value !== null
			? JSON.stringify(value, null, 2) // For objects and arrays, stringify
			: String(value); // For primitives, use raw value

		await navigator.clipboard.writeText(textToCopy);
		copiedKey.value = key;

		setTimeout(() => {
			copiedKey.value = null;
		}, 1500);
	}
	catch (error) {
		console.error('Failed to copy:', error);
	}
}

// Get all section keys (only objects/arrays at root level)
const allSectionKeys = computed(() => {
	if (currentDepth === 0) {
		return Object.keys(props.value).filter((key) => {
			const val = props.value[key];
			return (typeof val === 'object' && val !== null) || Array.isArray(val);
		});
	}

	return [];
});

// Get primitive keys at root level
const primitiveKeys = computed(() => {
	if (currentDepth === 0) {
		return Object.keys(props.value).filter((key) => {
			const val = props.value[key];
			return !((typeof val === 'object' && val !== null) || Array.isArray(val));
		});
	}

	return [];
});

// Accordion state for top-level sections - start expanded
const expandedSections = ref<string[]>(allSectionKeys.value);

// Expand/collapse state
const allExpanded = computed(() => {
	if (currentDepth !== 0) return false;
	return expandedSections.value.length === allSectionKeys.value.length;
});

const allCollapsed = computed(() => {
	if (currentDepth !== 0) return false;
	return expandedSections.value.length === 0;
});

// Expand/collapse functions
function expandAll() {
	expandedSections.value = [...allSectionKeys.value];
}

function collapseAll() {
	expandedSections.value = [];
}

// Update parent when state changes
function updateParent() {
	if (props.onExpandCollapseUpdate && currentDepth === 0) {
		props.onExpandCollapseUpdate({
			expandAll,
			collapseAll,
			allExpanded: allExpanded.value,
			allCollapsed: allCollapsed.value,
		});
	}
}

// Initial update and watch for changes
if (currentDepth === 0) {
	updateParent();
	watch([expandedSections, allSectionKeys], updateParent);
}

// Helper function to format keys using Directus format-title
function formatKey(key: string): string {
	return formatTitle(key);
}

// Helper function to format values
function formatValue(key: string, value: any): string {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return '—';
	}

	// Handle dates (ISO format or date objects)
	if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at') || key.toLowerCase().includes('time')) {
		try {
			const date = new Date(value);

			if (!Number.isNaN(date.getTime())) {
				return date.toLocaleString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				});
			}
		}
		catch {
			// Fall through to return original value
		}
	}

	// Handle boolean values
	if (typeof value === 'boolean') {
		return value ? 'Yes' : 'No';
	}

	// Return as-is for strings (now using labels)
	return String(value);
}
</script>

<template>
	<div class="formatted-view-container" :class="[{ 'depth-0': currentDepth === 0 }]" :style="containerStyle">
		<template v-if="value && Object.keys(value).length > 0">
			<!-- Two column grid for nested objects -->
			<div
				v-if="currentDepth > 0"
				class="field-grid"
			>
				<div
					v-for="key in Object.keys(value)"
					:key="key"
					class="box grid-item" :class="[{
						'span-full': typeof value[key] === 'object' || Array.isArray(value[key]),
					}]"
				>
					<p class="key type-label">
						{{ formatKey(key) }}
					</p>

					<!-- Check the type of the value. If it's an object or an array, render it recursively. -->
					<div
						v-if="typeof value[key] === 'object' && value[key] !== null && !Array.isArray(value[key])"
						class="child nested-object"
					>
						<FormattedView :value="value[key]" :depth="currentDepth + 1" :color-key="colorKey" />
					</div>

					<!-- Handle arrays -->
					<div v-else-if="Array.isArray(value[key])" class="array-container">
						<div v-for="(item, index) in value[key]" :key="index" class="array-item">
							<span class="array-index">{{ index + 1 }}.</span>
							<span v-if="typeof item === 'object' && item !== null" class="array-object">
								<FormattedView :value="item" :depth="currentDepth + 1" :color-key="colorKey" />
							</span>
							<span v-else class="array-value">{{ item }}</span>
						</div>
					</div>

					<!-- Handle primitive values -->
					<div v-else class="field-value">
						<!-- Email links -->
						<p v-if="isEmail(value[key])" class="value type-text value-with-copy">
							<span class="value-content">
								<a :href="`mailto:${value[key]}`" target="_blank">{{ value[key] }}</a>
							</span>
							<span class="copy-wrapper">
								<button
									v-if="copiedKey !== key"
									v-tooltip="t('copy_raw_value')"
									class="copy-button"
									type="button"
									@click="copyToClipboard(key, value[key])"
								>
									<v-icon name="content_copy" small />
								</button>
								<span v-else class="copied-text">{{ t('copy_raw_value_success') }}</span>
							</span>
						</p>
						<!-- URL links -->
						<p v-else-if="isUrl(value[key])" class="value type-text value-with-copy">
							<span class="value-content">
								<a :href="value[key]" target="_blank" rel="noopener noreferrer">{{ value[key] }}</a>
							</span>
							<span class="copy-wrapper">
								<button
									v-if="copiedKey !== key"
									v-tooltip="t('copy_raw_value')"
									class="copy-button"
									type="button"
									@click="copyToClipboard(key, value[key])"
								>
									<v-icon name="content_copy" small />
								</button>
								<span v-else class="copied-text">{{ t('copy_raw_value_success') }}</span>
							</span>
						</p>
						<!-- Regular values -->
						<p v-else class="value type-text value-with-copy">
							<span class="value-content">{{ formatValue(key, value[key]) }}</span>
							<span class="copy-wrapper">
								<button
									v-if="copiedKey !== key"
									v-tooltip="t('copy_raw_value')"
									class="copy-button"
									type="button"
									@click="copyToClipboard(key, value[key])"
								>
									<v-icon name="content_copy" small />
								</button>
								<span v-else class="copied-text">{{ t('copy_raw_value_success') }}</span>
							</span>
						</p>
					</div>
				</div>
			</div>

			<!-- Top level - primitives and collapsible sections -->
			<div v-else class="root-level-container">
				<!-- Primitive fields in grid -->
				<div v-if="primitiveKeys.length > 0" class="field-grid primitives-grid">
					<div
						v-for="key in primitiveKeys"
						:key="key"
						class="box grid-item"
					>
						<p class="key type-label">
							{{ formatKey(key) }}
						</p>

						<!-- Handle primitive values -->
						<div class="field-value">
							<!-- Email links -->
							<p v-if="isEmail(value[key])" class="value type-text">
								<a :href="`mailto:${value[key]}`" target="_blank">{{ value[key] }}</a>
							</p>
							<!-- URL links -->
							<p v-else-if="isUrl(value[key])" class="value type-text">
								<a :href="value[key]" target="_blank" rel="noopener noreferrer">{{ value[key] }}</a>
							</p>
							<!-- Regular values -->
							<p v-else class="value type-text">
								{{ formatValue(key, value[key]) }}
							</p>
						</div>
					</div>
				</div>

				<!-- Object/Array sections with Accordion -->
				<AccordionRoot
					v-if="allSectionKeys.length > 0"
					v-model="expandedSections"
					type="multiple"
					class="accordion-root"
					:class="{ 'has-primitives-above': primitiveKeys.length > 0 }"
				>
					<AccordionItem
						v-for="key in allSectionKeys"
						:key="key"
						:value="key"
						class="box top-level-section"
					>
						<AccordionTrigger class="accordion-trigger">
							<div class="section-header-with-copy">
								<p class="key type-label section-header">
									{{ formatKey(key) }}
								</p>
								<span class="copy-wrapper">
									<button
										v-if="copiedKey !== key"
										v-tooltip="t('copy_raw_value')"
										class="copy-button"
										type="button"
										@click.stop="copyToClipboard(key, value[key])"
									>
										<v-icon name="content_copy" small />
									</button>
									<span v-else class="copied-text">{{ t('copy_raw_value_success') }}</span>
								</span>
							</div>
							<svg
								width="16"
								height="16"
								viewBox="0 0 12 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="accordion-chevron"
							>
								<path
									d="M4 3L7 6L4 9"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</AccordionTrigger>

						<AccordionContent class="accordion-content">
							<!-- Check the type of the value. If it's an object or an array, render it recursively. -->
							<div
								v-if="typeof value[key] === 'object' && value[key] !== null && !Array.isArray(value[key])"
								class="child nested-object"
							>
								<FormattedView :value="value[key]" :depth="currentDepth + 1" :color-key="colorKey" />
							</div>

							<!-- Handle arrays -->
							<div v-else-if="Array.isArray(value[key])" class="array-container">
								<div v-for="(item, index) in value[key]" :key="index" class="array-item">
									<span class="array-index">{{ index + 1 }}.</span>
									<span v-if="typeof item === 'object' && item !== null" class="array-object">
										<FormattedView :value="item" :depth="currentDepth + 1" :color-key="colorKey" />
									</span>
									<span v-else class="array-value">{{ item }}</span>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</AccordionRoot>
			</div>
		</template>
		<template v-else>
			<p class="no-data">
				No data
			</p>
		</template>
	</div>
</template>

<style lang="css" scoped>
.formatted-view-container {
	width: 100%;
	font-size: 14px;
	padding: 1rem;
}

/* Two column grid layout */
.field-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1.5rem 2rem;
	width: 100%;
}

.grid-item {
	min-width: 0; /* Prevents grid blowout */
}

/* Full width items (for nested objects and arrays) */
.span-full {
	grid-column: 1 / -1;
}

/* Single column on smaller viewports */
@media (max-width: 768px) {
	.field-grid {
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.span-full {
		grid-column: 1;
	}
}

.key {
	margin-bottom: 0.375rem;
	color: var(--color-key, var(--theme--foreground-accent));
	font-weight: 500;
	font-size: 12px;
}

.section-header {
	font-size: 16px;
	font-weight: 600;
	color: var(--color-key, var(--theme--primary));
	margin-bottom: 1rem;
}

.value {
	margin-top: 0.25rem;
	color: var(--theme--foreground);
	word-break: break-word;
	line-height: 1.6;
	font-size: 14px;
}

.no-data {
	color: var(--theme--foreground-accent);
	font-style: italic;
	padding: 2rem;
	text-align: center;
}

.child {
	margin-top: 0.75rem;
}

.box {
	margin-bottom: 0;
}

/* Box styling for grid items */
.field-grid .box {
	padding-bottom: 0;
	border-bottom: none;
}

/* Box styling for non-grid (top-level sections) */
.depth-0 > .box {
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--theme--border-color-subdued);
}

.depth-0 > .box:last-child {
	border-bottom: none;
	padding-bottom: 0;
}

.top-level-section {
	margin-bottom: 1rem;
	padding: 0;
	position: relative;
	border-bottom: 1px solid var(--theme--border-color-subdued);
}

.top-level-section[data-state='open'] {
	padding-bottom: 1.5rem;
}

.top-level-section:last-child {
	margin-bottom: 0;
	border-bottom: none;
}

.top-level-section:last-child[data-state='open'] {
	padding-bottom: 0;
}

.nested-object {
	padding: 0;
	/* margin-top: 0.75rem; */
}

/* Array handling */
.array-container {
	margin-top: 0.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.array-item {
	display: flex;
	align-items: flex-start;
	padding: 0.75rem;
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color-subdued);
	border-radius: 6px;
	transition: border-color 0.2s;
}

.array-item:hover {
	border-color: var(--theme--border-color);
}

.array-index {
	font-weight: 700;
	margin-right: 0.75rem;
	color: var(--theme--primary);
	min-width: 1.5rem;
	font-size: 12px;
}

.array-object {
	flex: 1;
}

.array-value {
	color: var(--theme--foreground);
	line-height: 1.6;
}

/* Links (email and URLs) */
.value a {
	color: var(--theme--primary);
	text-decoration: none;
	word-break: break-all;
	transition: opacity 0.2s;
}

.value a:hover {
	opacity: 0.8;
	text-decoration: underline;
}

/* Make text selectable */
*:not(svg *) {
	user-select: text !important;
}

/* Field value container */
.field-value {
	margin-top: 0.25rem;
}

/* Copy functionality */
.value-with-copy {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	position: relative;
}

.value-content {
	display: inline;
}

.copy-button {
	all: unset;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.25rem;
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	border-radius: 4px;
	opacity: 0 !important;
	transition: opacity 0.2s, background-color 0.15s, color 0.15s;
	flex-shrink: 0;
	user-select: none !important;
}

.value-with-copy:hover .copy-wrapper .copy-button,
.section-header-with-copy:hover .copy-wrapper .copy-button {
	opacity: 1 !important;
}

.copy-button:hover {
	color: var(--theme--foreground);
	background-color: var(--theme--background-subdued);
}

.copy-button:active {
	transform: scale(0.95);
}

.copy-wrapper {
	position: relative;
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
	min-height: 24px;
}

.copied-text {
	position: absolute;
	left: 0;
	top: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	font-size: 11px;
	color: var(--theme--primary);
	font-weight: 600;
	white-space: nowrap;
	user-select: none !important;
	background: var(--theme--background);
	padding: 0 0.5rem;
	border-radius: 4px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header-with-copy {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
}

.section-header-with-copy .section-header {
	margin-bottom: 0;
}

/* Root level container */
.root-level-container {
	width: 100%;
}

/* Primitives grid spacing */
.primitives-grid {
	margin-bottom: 2rem;
	padding-bottom: 2rem;
	border-bottom: 1px solid var(--theme--border-color-subdued);
}

/* Accordion styles */
.accordion-root {
	width: 100%;
}

.accordion-root.has-primitives-above {
	margin-top: 0;
}

.accordion-trigger {
	all: unset;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	cursor: pointer;
	user-select: none;
	position: sticky;
	top: 0;
	z-index: 10;
	background: var(--theme--background);
	padding-bottom: 0.5rem;
}

.accordion-chevron {
	color: var(--theme--foreground-subdued);
	transition: transform 0.2s;
	flex-shrink: 0;
	margin-left: 1rem;
	margin-right: 0.5rem;
}

.accordion-trigger[data-state='open'] .accordion-chevron {
	transform: rotate(90deg);
}

.accordion-content {
	overflow: hidden;
}

.accordion-content[data-state='open'] {
	animation: accordion-down 0.2s ease-out;
}

.accordion-content[data-state='closed'] {
	animation: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
	from {
		height: 0;
		opacity: 0;
	}
	to {
		height: var(--reka-accordion-content-height);
		opacity: 1;
	}
}

@keyframes accordion-up {
	from {
		height: var(--reka-accordion-content-height);
		opacity: 1;
	}
	to {
		height: 0;
		opacity: 0;
	}
}
</style>
