<script lang="ts" setup>
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FormattedView from '../shared/formatted-view.vue';
import JsonTreeView from '../shared/json-tree-view.vue';

interface Props {
	value: Record<string, any> | any[] | null;
	type: string;
	defaultView?: 'formatted' | 'tree';
	maxHeight?: number | null;
	colorKey?: string | null;
	colorString?: string | null;
	colorNumber?: string | null;
	colorBoolean?: string | null;
	colorNull?: string | null;
	initialTreeDepth?: number;
}

const props = withDefaults(defineProps<Props>(), {
	defaultView: 'formatted',
	maxHeight: 600,
	colorString: '#22863a',
	colorNumber: '#005cc5',
	colorBoolean: '#6f42c1',
	colorNull: null,
	colorKey: null,
	initialTreeDepth: 2,
});

const { t } = useI18n();

// Modal state
const showModal = ref(false);

// View mode state
type ViewMode = 'formatted' | 'tree';
const viewMode = ref<ViewMode>(props.defaultView);

// Determine type and count
const itemType = computed(() => {
	if (!props.value) return 'empty';
	return Array.isArray(props.value) ? 'array' : 'object';
});

const itemCount = computed(() => {
	if (!props.value) return 0;
	return Array.isArray(props.value) ? props.value.length : Object.keys(props.value).length;
});

const badgeText = computed(() => {
	if (!props.value) return 'Empty';
	const count = itemCount.value;
	const label = itemType.value === 'array' ? 'items' : 'properties';
	return `${count} ${label}`;
});

// Handle toggle group update
function handleViewModeUpdate(newValue: ViewMode | undefined) {
	if (newValue) {
		viewMode.value = newValue;
	}
}

// Expand/collapse functions for active view
const expandCollapseFns = ref<{
	expandAll: () => void;
	collapseAll: () => void;
	allExpanded: boolean;
	allCollapsed: boolean;
} | null>(null);

function handleExpandCollapseUpdate(fns: {
	expandAll: () => void;
	collapseAll: () => void;
	allExpanded: boolean;
	allCollapsed: boolean;
}) {
	expandCollapseFns.value = fns;
}

function expandAll() {
	expandCollapseFns.value?.expandAll();
}

function collapseAll() {
	expandCollapseFns.value?.collapseAll();
}

const isExpandDisabled = computed(() => expandCollapseFns.value?.allExpanded ?? false);
const isCollapseDisabled = computed(() => expandCollapseFns.value?.allCollapsed ?? false);

// View content style with max height
const viewContentStyle = computed(() => {
	if (props.maxHeight) {
		return {
			maxHeight: `${props.maxHeight}px`,
		};
	}

	return {};
});

// Open modal
function openModal() {
	if (props.value) {
		showModal.value = true;
	}
}
</script>

<template>
	<div class="dynamic-json-display">
		<!-- Badge for table cell -->
		<div class="json-badge" @click.stop="openModal">
			<span class="badge-text">{{ badgeText }}</span>
		</div>

		<!-- Modal Dialog -->
		<v-dialog v-model="showModal" @esc="showModal = false">
			<v-card class="modal-card">
				<v-card-title>
					<div class="modal-header">
						<span>JSON Data</span>
						<div class="modal-controls">
							<!-- View toggle -->
							<ToggleGroupRoot
								:model-value="viewMode"
								type="single"
								class="view-toggle-group"
								@update:model-value="handleViewModeUpdate"
							>
								<ToggleGroupItem
									v-tooltip="t('formatted_view')"
									value="formatted"
									class="view-toggle-item"
								>
									<v-icon name="article" />
								</ToggleGroupItem>
								<ToggleGroupItem
									v-tooltip="t('tree_view')"
									value="tree"
									class="view-toggle-item"
								>
									<v-icon name="code_blocks" />
								</ToggleGroupItem>
							</ToggleGroupRoot>

							<!-- Expand/Collapse buttons -->
							<div class="expand-collapse-buttons">
								<v-button
									v-tooltip="t('collapse_all')"
									icon
									x-small
									kind="secondary"
									:title="t('collapse_all')"
									:disabled="isCollapseDisabled"
									@click="collapseAll"
								>
									<v-icon name="unfold_less" />
								</v-button>

								<v-button
									v-tooltip="t('expand_all')"
									icon
									x-small
									kind="secondary"
									:title="t('expand_all')"
									:disabled="isExpandDisabled"
									@click="expandAll"
								>
									<v-icon name="unfold_more" />
								</v-button>
							</div>
						</div>
					</div>
				</v-card-title>
				<v-card-text>
					<!-- View content -->
					<div class="view-content" :style="viewContentStyle">
						<template v-if="value && Object.keys(value).length > 0">
							<FormattedView
								v-if="viewMode === 'formatted'"
								:value="value"
								:color-key="colorKey"
								:on-expand-collapse-update="handleExpandCollapseUpdate"
							/>
							<JsonTreeView
								v-else
								:value="value"
								:initial-depth="initialTreeDepth"
								:color-string="colorString"
								:color-number="colorNumber"
								:color-boolean="colorBoolean"
								:color-null="colorNull"
								:color-key="colorKey"
								:on-expand-collapse-update="handleExpandCollapseUpdate"
							/>
						</template>
						<template v-else>
							<v-info :title="t('no_data')" icon="info">
								{{ t('no_data') }}
							</v-info>
						</template>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button @click="showModal = false">
						{{ t('done') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="css" scoped>
.dynamic-json-display {
	display: inline-flex;
	align-items: center;
}

.json-badge {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.5rem;
	background: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	font-size: 13px;
	color: var(--theme--foreground);
	cursor: pointer;
	transition: all 0.15s;
}

.json-badge:hover {
	background: var(--theme--background-normal);
	border-color: var(--theme--border-color);
	color: var(--theme--foreground);
}

.badge-text {
	font-family: var(--theme--fonts--sans--font-family);
	white-space: nowrap;
}

/* Modal styles */
.modal-card {
	width: 600px;
	max-width: 90vw;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	gap: 1rem;
}

.modal-controls {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

/* View toggle group */
.view-toggle-group {
	display: inline-flex;
	gap: 4px;
	background: var(--theme--background);
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	padding: 4px;
}

.view-toggle-item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	padding: 0;
	color: var(--theme--foreground-subdued);
	background-color: transparent;
	border: none;
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	transition: var(--fast) var(--transition);
	transition-property: background-color, color;
}

.view-toggle-item:hover {
	color: var(--theme--foreground);
	background-color: var(--theme--background-subdued);
}

.view-toggle-item[data-state='on'] {
	color: var(--theme--foreground);
	background-color: var(--theme--background-normal);
}

.view-toggle-item:focus-visible {
	outline: 2px solid var(--theme--primary);
	outline-offset: 2px;
}

.expand-collapse-buttons {
	display: flex;
	gap: 0.5rem;
}

/* View content */
.view-content {
	width: 100%;
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color-subdued);
	border-radius: 6px;
	overflow-y: auto;
	max-height: min(600px, 70vh);
}

.view-content :deep(.v-info) {
	margin: 1rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
	.view-content {
		max-height: min(400px, 60vh);
	}
}
</style>
