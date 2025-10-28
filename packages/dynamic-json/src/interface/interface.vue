<script lang="ts" setup>
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FormattedView from '../shared/formatted-view.vue';
import JsonTreeView from '../shared/json-tree-view.vue';

defineOptions({
	name: 'DynamicJson',
});

const props = withDefaults(
	defineProps<{
		value: Record<string, any>;
		field: string;
		defaultView?: 'formatted' | 'tree';
		initialTreeDepth?: number;
		maxHeight?: number | null;
		colorString?: string | null;
		colorNumber?: string | null;
		colorBoolean?: string | null;
		colorNull?: string | null;
		colorKey?: string | null;
	}>(),
	{
		defaultView: 'formatted',
		initialTreeDepth: 2,
		maxHeight: 600,
		colorString: '#22863a',
		colorNumber: '#005cc5',
		colorBoolean: '#6f42c1',
		colorNull: null,
		colorKey: null,
	},
);

const { t } = useI18n();

type ViewMode = 'formatted' | 'tree';

const viewMode = ref<ViewMode>(props.defaultView);

// Storage key for persisting view preference
const storageKey = computed(() => `dynamic-json-view-mode-${props.field}`);

// Load saved view preference
onMounted(() => {
	const saved = localStorage.getItem(storageKey.value);

	if (saved === 'formatted' || saved === 'tree') {
		viewMode.value = saved;
	}
});

// Watch for view mode changes and persist
watch(viewMode, (newValue) => {
	if (newValue) {
		localStorage.setItem(storageKey.value, newValue);
	}
});

// Handle toggle group update to ensure a value is always set
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

// Help dialog
const showHelpDialog = ref(false);

// View content style with max height
const viewContentStyle = computed(() => {
	if (props.maxHeight) {
		return {
			maxHeight: `${props.maxHeight}px`,
		};
	}

	return {};
});
</script>

<template>
	<div class="dynamic-json-interface">
		<!-- Header controls -->
		<div class="header-controls">
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

			<div class="controls-right">
				<!-- Help icon -->
				<v-icon
					v-tooltip="t('keyboard_shortcuts')"
					name="help"
					class="help-icon"
					@click="showHelpDialog = true"
				/>

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

		<!-- Help Dialog -->
		<v-dialog v-model="showHelpDialog" @esc="showHelpDialog = false">
			<v-card>
				<v-card-title>{{ t('keyboard_shortcuts') }}</v-card-title>
				<v-card-text>
					<div class="help-content">
						<div class="help-section">
							<h3>{{ t('navigation') }}</h3>
							<div class="shortcut-list">
								<div class="shortcut-item">
									<kbd>Tab</kbd>
									<span>{{ t('move_between_controls') }}</span>
								</div>
								<div class="shortcut-item">
									<kbd>↑</kbd> <kbd>↓</kbd>
									<span>{{ t('navigate_items') }}</span>
								</div>
								<div class="shortcut-item">
									<kbd>←</kbd> <kbd>→</kbd>
									<span>{{ t('collapse_expand_items') }}</span>
								</div>
							</div>
						</div>

						<div class="help-section">
							<h3>{{ t('actions') }}</h3>
							<div class="shortcut-list">
								<div class="shortcut-item">
									<kbd>Space</kbd> or <kbd>Enter</kbd>
									<span>{{ t('toggle_expand_collapse') }}</span>
								</div>
							</div>
						</div>

						<div class="help-section">
							<h3>{{ t('tips') }}</h3>
							<ul class="tips-list">
								<li>{{ t('view_toggle_tip') }}</li>
								<li>{{ t('expand_collapse_tip') }}</li>
								<li>{{ t('view_preference_saved') }}</li>
								<li>{{ t('urls_emails_clickable') }}</li>
							</ul>
						</div>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button @click="showHelpDialog = false">
						{{ t('done') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="css" scoped>
.dynamic-json-interface {
	position: relative;
	width: 100%;
}

/* Header controls */
.header-controls {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;
}

.controls-right {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.help-icon {
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	transition: color 0.15s;
}

.help-icon:hover {
	color: var(--theme--foreground);
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
}

.view-content :deep(.v-info) {
	margin: 1rem;
}

/* Help Dialog */
.help-content {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.help-section h3 {
	font-size: 14px;
	font-weight: 600;
	color: var(--theme--foreground);
	margin-bottom: 0.75rem;
}

.shortcut-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.shortcut-item {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.5rem;
	background: var(--theme--background-subdued);
	border-radius: 4px;
}

.shortcut-item kbd {
	display: inline-block;
	padding: 0.25rem 0.5rem;
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 12px;
	font-weight: 600;
	color: var(--theme--foreground);
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color);
	border-radius: 4px;
	box-shadow: 0 1px 0 var(--theme--border-color);
}

.shortcut-item span {
	flex: 1;
	font-size: 13px;
	color: var(--theme--foreground-subdued);
}

.tips-list {
	list-style: disc;
	padding-left: 1.5rem;
	margin: 0;
}

.tips-list li {
	font-size: 13px;
	color: var(--theme--foreground-subdued);
	line-height: 1.6;
	margin-bottom: 0.5rem;
}

.tips-list li:last-child {
	margin-bottom: 0;
}
</style>
