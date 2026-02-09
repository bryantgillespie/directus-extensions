<script setup lang="ts">
import { defineProps } from 'vue';

interface Props {
	content: string;
}

defineProps<Props>();
</script>

<template>
	<div v-if="content" class="wysiwyg-content" v-html="content" />
</template>

<style scoped lang="scss">
.wysiwyg-content {
	color: var(--theme--form--field--input--foreground);
	background-color: var(--theme--form--field--input--background);
	font-family: var(--theme--fonts--sans--font-family);
	line-height: var(--theme--form--field--input--line-height);
	margin: 20px;
	-webkit-font-smoothing: antialiased;
	text-rendering: optimizeLegibility;
	-moz-osx-font-smoothing: grayscale;
}

:deep(*:not(:last-child)) {
	margin-bottom: var(--theme--form--row-gap);
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
	font-family: var(--theme--fonts--display--font-family);
	font-weight: var(--theme--fonts--display--font-weight);
	color: var(--theme--form--field--input--foreground-accent);
	line-height: 1.2;
	margin-bottom: var(--theme--form--row-gap);
}

:deep(h1) {
	font-size: 36px;
}
:deep(h2) {
	font-size: 24px;
}
:deep(h3) {
	font-size: 19px;
}
:deep(h4) {
	font-size: 16px;
}
:deep(h5) {
	font-size: 14px;
}
:deep(h6) {
	font-size: 12px;
}

:deep(p) {
	margin-bottom: var(--theme--form--row-gap);
}

:deep(a) {
	color: var(--theme--primary-accent);
	text-decoration: none;
	&:hover {
		text-decoration: underline;
	}
}

:deep(ul),
:deep(ol) {
	padding-left: calc(var(--theme--form--field--input--padding) * 1.5);
	margin-bottom: var(--theme--form--row-gap);
}

:deep(li) {
	margin-bottom: calc(var(--theme--form--row-gap) / 3);
	> p {
		margin-bottom: calc(var(--theme--form--row-gap) / 3);
	}
}

:deep(b),
:deep(strong) {
	font-weight: 700;
}

:deep(pre),
:deep(code) {
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 14px;
	line-height: 24px;
	background-color: var(--theme--background-subdued);
	color: var(--theme--foreground);
	padding: calc(var(--theme--form--field--input--padding) / 2);
	border-radius: var(--theme--border-radius);
	overflow-x: auto;
}

:deep(pre) {
	margin-bottom: var(--theme--form--row-gap);
}

:deep(blockquote) {
	font-style: italic;
	color: var(--theme--foreground-subdued);
	border-left: 3px solid var(--theme--primary);
	padding-left: var(--theme--form--field--input--padding);
	margin-left: 0;
}

:deep(img),
:deep(video) {
	max-width: 100%;
	height: auto;
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--card--shadow);
}

:deep(iframe) {
	max-width: 100%;
	border-radius: var(--theme--border-radius);
}

:deep(hr) {
	border: none;
	border-top: var(--theme--border-width) solid var(--theme--border-color);
	margin: calc(var(--theme--form--row-gap) * 1.5) 0;
}

:deep(table) {
	border-collapse: collapse;
	width: 100%;
	margin-bottom: var(--theme--form--row-gap);
}

:deep(th),
:deep(td) {
	border: var(--theme--border-width) solid var(--theme--border-color);
	padding: calc(var(--theme--form--field--input--padding) / 2);
	text-align: left;
}

:deep(th) {
	background-color: var(--theme--background-subdued);
	font-weight: var(--theme--fonts--sans--font-weight);
	color: var(--theme--foreground-accent);
}

:deep(figure) {
	margin: 1rem auto;
	text-align: center;

	figcaption {
		color: var(--theme--foreground-subdued);
		margin-top: 0.25rem;
	}
}
</style>
