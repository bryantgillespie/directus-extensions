<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue';
import Preview from './preview.vue';

interface Props {
	collection: string;
	primaryKey: string;
	value: any;
	baseUrl?: string;
	startCollapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	baseUrl: 'http://localhost:3000',
	startCollapsed: false,
});
const values = inject('values') as any;
const url = ref('');
const isPreviewHidden = ref(props.startCollapsed);

// Set initial URL based on props
onMounted(() => {
	// Set initial URL using props and baseUrl option
	if (props.collection && props.primaryKey) {
		const baseUrl = props.baseUrl || 'http://localhost:3000';
		url.value = `${baseUrl}/_blocks/${props.collection}/${props.primaryKey}`;
	}
});

// Watch for any changes in the values
watch(values, () => {
	if (props.collection && props.primaryKey) {
		// Keep using props for the URL as they're stable
		const baseUrl = props.baseUrl || 'http://localhost:3000';
		url.value = `${baseUrl}/_blocks/${props.collection}/${props.primaryKey}`;
	}
}, {
	deep: true,
	immediate: false, // Don't trigger on mount
});
</script>

<template>
	<div class="preview-wrapper" :class="{ 'preview-hidden': isPreviewHidden }">
		<div v-show="!isPreviewHidden" class="preview-container">
			<Preview
				v-if="url"
				:url="url"
				:allow-hide="true"
				:collection="props.collection"
				:values="values"
				@toggle-visibility="isPreviewHidden = !isPreviewHidden"
			/>
			<div v-else class="placeholder">
				<v-icon name="info" /> {{ url || 'Loading preview...' }}
			</div>
		</div>

		<div v-show="isPreviewHidden" class="collapsed-preview" @click="isPreviewHidden = false">
			<v-icon name="visibility" />
			<span>Show Block Preview</span>
		</div>
	</div>
</template>

<style scoped>
.preview-wrapper {
	width: 100%;
	height: clamp(130px, 30svh, 360px); /* responsive height with bounds */
	margin: 12px 0;
	transition: height 0.3s ease;
}

.preview-wrapper.preview-hidden {
	height: 44px; /* Just enough for the collapsed bar */
}

.preview-container {
	width: 100%;
	height: 100%;
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--background-subdued);
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
}

.collapsed-preview {
	width: 100%;
	height: 100%;
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-normal);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	cursor: pointer;
	color: var(--theme--foreground-subdued);
	transition: all 0.2s ease;
}

.collapsed-preview:hover {
	background-color: var(--theme--background-subdued);
	color: var(--theme--foreground);
}

.placeholder {
	color: var(--theme--foreground-subdued);
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 20px;
	text-align: center;
}
</style>
