<script setup lang="ts">
import { useElementSize, useEventListener } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	url: string;
	allowHide?: boolean;
	collection?: string;
	values?: any;
}>();

const emit = defineEmits<{
	toggleVisibility: [];
}>();

const { t } = useI18n();

const isRefreshing = ref(false);
const frameEl = ref<HTMLIFrameElement>();
const previewEl = ref<HTMLElement>();
const containerEl = ref<HTMLElement>();
const showHelpModal = ref(false);
const zoomLevel = ref<'auto' | 25 | 50 | 75 | 100>('auto');

const deviceMode = ref<'mobile' | 'desktop'>('desktop');

// Track iframe content dimensions
const contentWidth = ref(1200);
const contentHeight = ref(800);

// Get container size for scaling calculations
const { width: containerWidth, height: containerHeight } = useElementSize(containerEl);

// Calculate display dimensions based on device mode
const displayWidth = computed(() => deviceMode.value === 'mobile' ? 375 : 1200);
const displayHeight = computed(() => deviceMode.value === 'mobile' ? 600 : 800);

// Calculate optimal scale to fit content in container
const optimalScale = computed(() => {
	if (!containerWidth.value || !containerHeight.value) return 1;
	
	const availableWidth = containerWidth.value - 32; // Account for padding
	const availableHeight = containerHeight.value - 32;
	
	const scaleX = availableWidth / contentWidth.value;
	const scaleY = availableHeight / contentHeight.value;
	
	if (zoomLevel.value === 'auto') {
		// Auto mode: fit both width and height (contain behavior)
		const scale = Math.min(scaleX, scaleY, 1); // Never scale above 1:1
		return Math.max(scale, 0.1); // Minimum scale of 10%
	} else {
		// Fixed zoom level
		return zoomLevel.value / 100;
	}
});

// Calculate if content will overflow at current zoom level
const willOverflow = computed(() => {
	if (zoomLevel.value === 'auto') return false;
	
	const scaledWidth = contentWidth.value * optimalScale.value;
	const scaledHeight = contentHeight.value * optimalScale.value;
	const availableWidth = containerWidth.value - 32;
	const availableHeight = containerHeight.value - 32;
	
	return scaledWidth > availableWidth || scaledHeight > availableHeight;
});

// Zoom level options for v-select
const zoomOptions = [
	{ text: 'Auto Fit', value: 'auto' },
	{ text: '25%', value: 25 },
	{ text: '50%', value: 50 },
	{ text: '75%', value: 75 },
	{ text: '100%', value: 100 }
];


function toggleDevice() {
	deviceMode.value = deviceMode.value === 'mobile' ? 'desktop' : 'mobile';
	
	// Update content dimensions for new device mode
	contentWidth.value = displayWidth.value;
	contentHeight.value = displayHeight.value;
	
	// Send new width to iframe for responsive changes without refreshing
	if (frameEl.value?.contentWindow) {
		frameEl.value.contentWindow.postMessage({
			type: 'widthUpdate',
			width: displayWidth.value,
			deviceMode: deviceMode.value
		}, '*');
		
		// Request new dimensions after the iframe has time to reflow
		setTimeout(() => {
			requestContentDimensions();
		}, 100);
	}
}

function onIframeLoad() {
	isRefreshing.value = false;
	requestContentDimensions();
	
	// Send initial values when iframe loads
	sendPreviewData();
}

// Debounced preview data sender
let previewDataTimeout: NodeJS.Timeout | null = null;

function sendPreviewData() {
	if (previewDataTimeout) {
		clearTimeout(previewDataTimeout);
	}
	
	previewDataTimeout = setTimeout(() => {
		if (frameEl.value?.contentWindow && props.collection && props.values) {
			const previewData = {
				type: 'previewUpdate',
				collection: props.collection,
				data: props.values
			};
			frameEl.value.contentWindow.postMessage(previewData, '*');
		}
	}, 100);
}

function requestContentDimensions() {
	if (frameEl.value?.contentWindow) {
		frameEl.value.contentWindow.postMessage({
			type: 'requestDimensions'
		}, '*');
	}
}

function refresh() {
	if (!frameEl.value || isRefreshing.value) return;
	isRefreshing.value = true;
	
	// Allow the iframe to refresh without triggering leave dialog
	frameEl.value.contentWindow?.postMessage({
		type: 'allowRefresh'
	}, '*');
	
	// Small delay to ensure message is received before refresh
	setTimeout(() => {
		if (frameEl.value) {
			frameEl.value.src = props.url;
		}
	}, 10);
}

// Listen for messages from iframe
useEventListener(window, 'message', (event) => {
	if (event.data.type === 'contentDimensions') {
		contentWidth.value = event.data.width || displayWidth.value;
		contentHeight.value = event.data.height || displayHeight.value;
	}
});


// Initialize content dimensions based on device mode
watch(deviceMode, () => {
	contentWidth.value = displayWidth.value;
	contentHeight.value = displayHeight.value;
}, { immediate: true });

// Watch for changes in values prop and send to iframe
watch(() => props.values, (newValues) => {
	if (newValues) {
		sendPreviewData();
	}
}, { deep: true });
</script>

<template>
	<div ref="previewEl" class="live-preview">
		<div class="header">
			<div class="group">
				<v-button
					v-tooltip.bottom="t('refresh')"
					x-small
					icon
					rounded
					secondary
					:disabled="isRefreshing"
					@click="refresh"
				>
					<v-progress-circular v-if="isRefreshing" indeterminate x-small />
					<v-icon v-else small name="refresh" />
				</v-button>
				
				<v-button
					v-tooltip.bottom="'About Block Preview'"
					x-small
					icon
					rounded
					secondary
					@click="showHelpModal = true"
				>
					<v-icon small name="help_outline" />
				</v-button>
			</div>
			
			<div class="spacer" />
			
			<div class="dimensions">
				<input
					:value="Math.round(contentWidth)"
					class="width"
					readonly
				/>
				<v-icon x-small name="close" />
				<input
					:value="Math.round(contentHeight)"
					class="height"
					readonly
				/>
			</div>
			
			<div class="zoom-controls">
				<v-select
					v-model="zoomLevel"
					:items="zoomOptions"
					:show-deselect="false"
					:close-on-content-click="true"
					inline
					x-small
					placement="bottom-start"
				/>
			</div>
			
			<v-button
				v-tooltip.bottom="t('toggle_device')"
				x-small
				icon
				rounded
				secondary
				:active="deviceMode === 'mobile'"
				@click="toggleDevice"
			>
				<v-icon small :name="deviceMode === 'mobile' ? 'smartphone' : 'desktop_windows'" />
			</v-button>
			
			<v-button
				v-if="allowHide"
				v-tooltip.bottom="'Hide Preview'"
				x-small
				icon
				rounded
				secondary
				@click="emit('toggleVisibility')"
			>
				<v-icon small name="visibility_off" />
			</v-button>
		</div>

		<div ref="containerEl" class="container" :class="{ 'custom-zoom-mode': zoomLevel !== 'auto', 'overflow-content': willOverflow }">
			<div class="iframe-view">
				<div 
					class="viewport" 
					:data-mode="deviceMode"
					:style="{
						'--content-width': contentWidth,
						'--content-height': contentHeight,
						'--scale': optimalScale
					}"
				>
					<iframe
						ref="frameEl"
						:src="url"
						:title="t('block_preview')"
						:scrolling="zoomLevel !== 'auto' ? 'yes' : 'no'"
						@load="onIframeLoad"
					/>
				</div>
			</div>
		</div>
		
		<!-- Help Modal -->
		<v-dialog v-model="showHelpModal" @esc="showHelpModal = false">
			<v-card>
				<v-card-title>
					<v-icon left name="help_outline" />
					Block Preview
				</v-card-title>
				
				<v-card-text>
					<div class="help-content">
						<p><strong>What is this?</strong></p>
						<p>This preview shows how your block will look on the website in real-time as you edit it.</p>
						
						<p><strong>Features:</strong></p>
						<ul>
							<li><strong>Live updates</strong> - Changes appear instantly as you edit fields</li>
							<li><strong>Device preview</strong> - Toggle between desktop (1200px) and mobile (375px) views</li>
							<li><strong>Smart scaling</strong> - Content automatically scales to fit the preview area ({{ Math.round(optimalScale * 100) }}% currently)</li>
							<li><strong>Interactive</strong> - You can interact with elements, but navigation is disabled</li>
						</ul>
						
						<p><strong>Controls:</strong></p>
						<ul>
							<li><v-icon small name="refresh" /> <strong>Refresh</strong> - Reload the preview if something looks wrong</li>
							<li><v-icon small name="zoom_out_map" />/<v-icon small name="height" /> <strong>Zoom mode</strong> - Auto fit (scales to fit container) or Fit width (allows scrolling for tall content)</li>
							<li><v-icon small name="desktop_windows" />/<v-icon small name="smartphone" /> <strong>Device toggle</strong> - Switch between desktop and mobile preview</li>
							<li><strong>Dimensions</strong> - Shows current preview size and scale percentage</li>
						</ul>
					</div>
				</v-card-text>
				
				<v-card-actions>
					<v-spacer />
					<v-button secondary @click="showHelpModal = false">
						Close
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style scoped lang="scss">
.live-preview {
	--preview--color: var(--theme--foreground);
	--preview--color-disabled: var(--theme--foreground-subdued);
	--preview--header--background-color: var(--theme--background-normal);
	--preview--header--border-color: var(--theme--border-color);
	--preview--header--height: 44px;

	container-type: inline-size;
	width: 100%;
	height: 100%;

	.header {
		width: 100%;
		color: var(--preview--color);
		background-color: var(--preview--header--background-color);
		border-bottom: 1px solid var(--preview--header--border-color);
		height: var(--preview--header--height);
		display: flex;
		align-items: center;
		z-index: 10;
		gap: 8px;
		padding: 0 12px;

		.group {
			display: contents;
		}

		.spacer {
			flex: 1;
		}

		.dimensions {
			display: flex;
			align-items: center;
			color: var(--preview--color-disabled);
			font-size: 12px;

			input {
				border: none;
				width: 40px;
				background-color: transparent;
				color: inherit;
				text-align: center;
				font-size: 12px;

				&:first-child {
					text-align: end;
				}
			}

			.v-icon {
				margin: 0 4px;
			}
		}

		.scale-info {
			display: flex;
			align-items: center;
			color: var(--preview--color-disabled);
			font-size: 11px;
			font-weight: 500;
			margin-right: 8px;
		}

		.zoom-controls {
			display: flex;
			align-items: center;
		}

		@container (max-width: 480px) {
			.dimensions {
				display: none;
			}
		}
	}

	.container {
		width: 100%;
		height: calc(100% - var(--preview--header--height));
		overflow: hidden; /* Default for auto mode */
		padding: 0;
		margin: 0;
		
		&.custom-zoom-mode {
			overflow: auto; /* Allow scrolling in custom zoom modes */
		}
		
		&.overflow-content {
			overflow: auto; /* Ensure scrolling when content overflows */
		}
	}

	.iframe-view {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		padding: 16px;
		background: var(--theme--background-subdued);
		position: relative;
		min-height: 100%;
		
		.overflow-content & {
			place-items: start center;
			padding: 16px;
		}
	}
	
	.viewport {
		position: relative;
		width: calc(var(--content-width) * 1px);
		height: calc(var(--content-height) * 1px);
		transform-origin: top left;
		transform: scale(var(--scale));
		will-change: transform;
		
		/* Use Directus theme variables for consistent styling */
		border: var(--theme--border-width) solid var(--theme--border-color);
		border-radius: var(--theme--border-radius);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		background: white;
		
		/* Center positioning when content fits */
		.container:not(.overflow-content) & {
			position: absolute;
			left: 50%;
			top: 50%;
			transform-origin: center;
			transform: translate(-50%, -50%) scale(var(--scale));
		}
		
		iframe {
			width: 100%;
			height: 100%;
			border: 0;
			background: transparent;
			-webkit-font-smoothing: antialiased;
		}
	}

	/* Remove fullscreen styles - no longer needed */
}

.help-content {
	p {
		margin-bottom: 12px;
		line-height: 1.5;
	}

	ul {
		margin: 8px 0 16px 0;
		padding-left: 20px;

		li {
			margin-bottom: 6px;
			line-height: 1.4;

			.v-icon {
				vertical-align: text-bottom;
				margin-right: 4px;
			}
		}
	}

	strong {
		color: var(--theme--foreground);
	}
}

</style>
