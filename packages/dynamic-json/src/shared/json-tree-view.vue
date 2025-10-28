<script lang="ts" setup>
import { TreeItem, TreeRoot } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isEmail, isUrl } from './utils';

interface TreeNode {
	key: string;
	value: any;
	type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
	children?: TreeNode[];
	path: string;
}

const props = defineProps<{
	value: Record<string, any> | any[];
	initialDepth?: number;
	colorString?: string | null;
	colorNumber?: string | null;
	colorBoolean?: string | null;
	colorNull?: string | null;
	colorKey?: string | null;
	onExpandCollapseUpdate?: (fns: {
		expandAll: () => void;
		collapseAll: () => void;
		allExpanded: boolean;
		allCollapsed: boolean;
	}) => void;
}>();

const initialDepth = props.initialDepth ?? 2;

const { t } = useI18n();

// Copy functionality
const copiedPath = ref<string | null>(null);

async function copyToClipboard(node: TreeNode) {
	try {
		const textToCopy = node.type === 'object' || node.type === 'array'
			? JSON.stringify(node.value, null, 2) // For objects and arrays, stringify
			: String(node.value); // For primitives, use raw value

		await navigator.clipboard.writeText(textToCopy);
		copiedPath.value = node.path;

		setTimeout(() => {
			copiedPath.value = null;
		}, 1500);
	}
	catch (error) {
		console.error('Failed to copy:', error);
	}
}

const containerStyle = computed(() => {
	const style: Record<string, string> = {};

	// Apply custom colors as CSS variables
	if (props.colorString) {
		style['--color-string'] = props.colorString;
	}

	if (props.colorNumber) {
		style['--color-number'] = props.colorNumber;
	}

	if (props.colorBoolean) {
		style['--color-boolean'] = props.colorBoolean;
	}

	if (props.colorNull) {
		style['--color-null'] = props.colorNull;
	}

	if (props.colorKey) {
		style['--color-key'] = props.colorKey;
	}

	return style;
});

// Transform JSON to tree structure
function transformToTree(obj: any, parentPath = '', depth = 0): TreeNode[] {
	if (obj === null || obj === undefined) {
		return [];
	}

	const entries = Array.isArray(obj)
		? obj.map((item, index) => [String(index), item] as [string, any])
		: Object.entries(obj);

	return entries.map(([key, val]) => {
		const path = parentPath ? `${parentPath}.${key}` : key;
		const type = getValueType(val);

		const node: TreeNode = {
			key,
			value: val,
			type,
			path,
		};

		if (type === 'object' || type === 'array') {
			node.children = transformToTree(val, path, depth + 1);
		}

		return node;
	});
}

function getValueType(val: any): TreeNode['type'] {
	if (val === null || val === undefined) return 'null';
	if (Array.isArray(val)) return 'array';
	if (typeof val === 'object') return 'object';
	if (typeof val === 'boolean') return 'boolean';
	if (typeof val === 'number') return 'number';
	return 'string';
}

function formatValue(node: TreeNode): string {
	if (node.type === 'null') return 'null';
	if (node.type === 'boolean') return String(node.value);
	if (node.type === 'string') return `"${node.value}"`;
	if (node.type === 'number') return String(node.value);
	if (node.type === 'array') return `Array[${node.children?.length ?? 0}]`;
	if (node.type === 'object') return `Object {${node.children?.length ?? 0}}`;
	return String(node.value);
}

function getValueClass(node: TreeNode): string {
	return `tree-value tree-${node.type}`;
}

// Calculate which nodes should be expanded initially
function getInitialExpanded(nodes: TreeNode[], depth = 0, maxDepth = initialDepth): string[] {
	const expanded: string[] = [];

	for (const node of nodes) {
		if ((node.type === 'object' || node.type === 'array') && depth < maxDepth) {
			expanded.push(node.path);

			if (node.children) {
				expanded.push(...getInitialExpanded(node.children, depth + 1, maxDepth));
			}
		}
	}

	return expanded;
}

const treeData = computed(() => transformToTree(props.value));
const expandedKeys = ref<string[]>(getInitialExpanded(treeData.value));

// Check if item has children
function hasChildren(item: any): boolean {
	const node = item.value as TreeNode;
	return (node.type === 'object' || node.type === 'array') && (node.children?.length ?? 0) > 0;
}

// Get all expandable keys
function getAllExpandableKeys(nodes: TreeNode[]): string[] {
	const keys: string[] = [];

	for (const node of nodes) {
		if ((node.type === 'object' || node.type === 'array') && (node.children?.length ?? 0) > 0) {
			keys.push(node.path);

			if (node.children) {
				keys.push(...getAllExpandableKeys(node.children));
			}
		}
	}

	return keys;
}

// All expandable keys
const allExpandableKeys = computed(() => getAllExpandableKeys(treeData.value));

// Expand/collapse state
const allExpanded = computed(() => {
	return expandedKeys.value.length === allExpandableKeys.value.length;
});

const allCollapsed = computed(() => {
	return expandedKeys.value.length === 0;
});

// Expand all nodes
function expandAll() {
	expandedKeys.value = [...allExpandableKeys.value];
}

// Collapse all nodes
function collapseAll() {
	expandedKeys.value = [];
}

// Update parent when state changes
function updateParent() {
	if (props.onExpandCollapseUpdate) {
		props.onExpandCollapseUpdate({
			expandAll,
			collapseAll,
			allExpanded: allExpanded.value,
			allCollapsed: allCollapsed.value,
		});
	}
}

// Initial update and watch for changes
updateParent();
watch([expandedKeys, allExpandableKeys], updateParent);
</script>

<template>
	<div class="json-tree-view" :style="containerStyle">
		<TreeRoot
			v-slot="{ flattenItems }"
			v-model:expanded="expandedKeys"
			:items="treeData"
			:get-key="(item: TreeNode) => item.path"
			:get-children="(item: TreeNode) => item.children ?? []"
			class="tree-root"
		>
			<TreeItem
				v-for="item in flattenItems"
				:key="item._id"
				v-bind="item.bind"
				v-slot="{ isExpanded, handleToggle }"
				class="tree-item" :class="[{ 'has-children': hasChildren(item) }]"
				:style="item.level > 1 ? { paddingLeft: `${(item.level - 1) * 1.5}rem` } : {}"
			>
				<div class="tree-item-content">
					<!-- Expansion toggle button -->
					<button
						v-if="hasChildren(item)"
						class="expand-button"
						:class="{ expanded: isExpanded }"
						type="button"
						@click="handleToggle()"
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="expand-icon"
						>
							<path
								d="M4 3L7 6L4 9"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
					<span v-else class="expand-spacer" />

					<!-- Key -->
					<span class="tree-key">{{ item.value.key }}:</span>

					<!-- Value (only for primitives) -->
					<template v-if="!hasChildren(item)">
						<!-- Email links -->
						<span v-if="isEmail(item.value.value) && item.value.type === 'string'" class="tree-value tree-string value-with-copy">
							"<a
								:href="`mailto:${item.value.value}`"
								target="_blank"
								class="tree-link"
							>{{ item.value.value }}</a>"
							<span class="copy-wrapper">
								<button
									v-if="copiedPath !== item.value.path"
									v-tooltip="t('copy_raw_value')"
									class="copy-button"
									type="button"
									@click.stop="copyToClipboard(item.value)"
								>
									<v-icon name="content_copy" small />
								</button>
								<span v-else class="copied-text">{{ t('copy_raw_value_success') }}</span>
							</span>
						</span>
						<!-- URL links -->
						<span v-else-if="isUrl(item.value.value) && item.value.type === 'string'" class="tree-value tree-string value-with-copy">
							"<a
								:href="item.value.value"
								target="_blank"
								rel="noopener noreferrer"
								class="tree-link"
							>{{ item.value.value }}</a>"
							<span class="copy-wrapper">
								<button
									v-if="copiedPath !== item.value.path"
									v-tooltip="t('copy_raw_value')"
									class="copy-button"
									type="button"
									@click.stop="copyToClipboard(item.value)"
								>
									<v-icon name="content_copy" small />
								</button>
								<span v-else class="copied-text">{{ t('copy_raw_value_success') }}</span>
							</span>
						</span>
						<!-- Regular values -->
						<span
							v-else
							class="value-with-copy" :class="[getValueClass(item.value)]"
						>
							{{ formatValue(item.value) }}
							<span class="copy-wrapper">
								<button
									v-if="copiedPath !== item.value.path"
									v-tooltip="t('copy_raw_value')"
									class="copy-button"
									type="button"
									@click.stop="copyToClipboard(item.value)"
								>
									<v-icon name="content_copy" small />
								</button>
								<span v-else class="copied-text">{{ t('copy_raw_value_success') }}</span>
							</span>
						</span>
					</template>

					<!-- Type indicator for objects/arrays -->
					<span
						v-else
						class="tree-type value-with-copy"
					>
						{{ formatValue(item.value) }}
						<span class="copy-wrapper">
							<button
								v-if="copiedPath !== item.value.path"
								class="copy-button"
								type="button"
								@click.stop="copyToClipboard(item.value)"
							>
								<v-icon name="content_copy" small />
							</button>
							<span v-else class="copied-text">Copied!</span>
						</span>
					</span>
				</div>
			</TreeItem>
		</TreeRoot>
	</div>
</template>

<style lang="css" scoped>
.json-tree-view {
	width: 100%;
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 13px;
	line-height: 1.6;
	padding: 1rem;
}

.tree-root {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.tree-item {
	display: block;
	user-select: text;
	list-style: none;
	margin: 0;
	padding: 0;
}

.tree-item.has-children {
	position: sticky;
	top: 0;
	z-index: 1;
	background: var(--theme--background);
}

.tree-item-content {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.125rem 0;
	transition: background-color 0.15s;
}

.tree-item-content:hover {
	background-color: var(--theme--background-subdued);
	border-radius: 4px;
}

/* Expansion button */
.expand-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	padding: 0;
	background: none;
	border: none;
	cursor: pointer;
	color: var(--theme--foreground-subdued);
	transition: transform 0.2s, color 0.15s;
	flex-shrink: 0;
}

.expand-button:hover {
	color: var(--theme--foreground);
}

.expand-icon {
	transition: transform 0.2s;
	pointer-events: none;
}

.expand-button.expanded .expand-icon {
	transform: rotate(90deg);
}

.expand-spacer {
	width: 16px;
	flex-shrink: 0;
}

/* Key styling */
.tree-key {
	color: var(--color-key, var(--theme--primary));
	font-weight: 500;
	margin-right: 0.25rem;
}

/* Value type styling */
.tree-value {
	color: var(--theme--foreground);
}

.tree-string {
	color: var(--color-string, #22863a);
}

.tree-number {
	color: var(--color-number, #005cc5);
}

.tree-boolean {
	color: var(--color-boolean, #6f42c1);
}

.tree-null {
	color: var(--color-null, var(--theme--foreground-subdued));
	font-style: italic;
}

.tree-type {
	color: var(--theme--foreground-subdued);
	font-size: 12px;
}

/* Links (email and URLs) */
.tree-link {
	color: var(--theme--primary);
	text-decoration: none;
	word-break: break-all;
	transition: opacity 0.2s;
	cursor: pointer;
	font-weight: 500;
}

.tree-link:hover {
	opacity: 0.8;
	text-decoration: underline;
}

/* Copy functionality */
.value-with-copy {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

.copy-button {
	all: unset;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.125rem;
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	border-radius: 3px;
	opacity: 0;
	transition: opacity 0.2s, background-color 0.15s, color 0.15s;
	flex-shrink: 0;
	vertical-align: middle;
	user-select: none !important;
}

.tree-item-content:hover .copy-wrapper .copy-button {
	opacity: 1;
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
	height: 20px;
	vertical-align: middle;
}

.copied-text {
	font-family: var(--theme--fonts--sans--font-family);
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 10px;
	color: var(--theme--primary);
	font-weight: 600;
	white-space: nowrap;
	user-select: none !important;
	background: var(--theme--background);
	padding: 0.125rem 0.375rem;
	border-radius: 3px;
	box-shadow: var(--theme--header--box-shadow);
}
</style>
