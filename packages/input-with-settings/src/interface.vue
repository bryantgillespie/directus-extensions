<script setup lang="ts">
import { ref, watch } from 'vue';

interface SettingOption {
	key: string;
	label: string;
	icon?: string;
	defaultValue?: string;
	choices: Array<{
		value: string;
		text: string;
		icon?: string;
	}>;
}

const props = defineProps<{
	value: Record<string, any>;
	placeholder?: string;
	settingsOptions: SettingOption[];
	contentKey: string;
	settingsTooltip: string;
}>();

const emit = defineEmits(['input']);

const localValue = ref(props.value || {});

watch(() => props.value, (newValue) => {
	if (newValue) {
		localValue.value = { ...newValue };
	}
}, { deep: true });

const updateValue = () => {
	emit('input', localValue.value);
};

const mainMenuOpen = ref(false);
const childMenuOpen = ref(false);
const activeSettingKey = ref<string | null>(null);
const activeChoices = ref<SettingOption['choices']>([]);

const closeChildMenu = () => {
	childMenuOpen.value = false;
	activeSettingKey.value = null;
};

const toggleMainMenu = (value: boolean) => {
	mainMenuOpen.value = value;

	if (!value) {
		closeChildMenu();
	}
};

const getChoiceText = (option: SettingOption, value: string) => {
	const choice = option.choices.find((c) => c.value === value);
	return choice ? choice.text : 'Not set';
};

const getChoiceIcon = (option: SettingOption, value: string) => {
	const choice = option.choices.find((c) => c.value === value);
	return choice?.icon;
};

// Initialize default values
for (const option of props.settingsOptions) {
	if (option.defaultValue && localValue.value[option.key] === undefined) {
		localValue.value[option.key] = option.defaultValue;
	}
}

const openChildMenu = (option: SettingOption) => {
	activeSettingKey.value = option.key;
	activeChoices.value = option.choices;
	childMenuOpen.value = true;
};

const selectChoice = (key: string, choice: string) => {
	localValue.value[key] = choice;
	updateValue();
	closeChildMenu();
};
</script>

<template>
	<div class="custom-input-with-settings">
		<v-input v-model="localValue[contentKey]" :placeholder="placeholder" @input="updateValue">
			<template #append>
				<v-menu show-arrow placement="bottom-end" :close-on-content-click="false" @update:model-value="toggleMainMenu">
					<template #activator="{ toggle }">
						<v-icon
							v-tooltip="{
								content: `<p>${settingsTooltip}</p>`,
							}" name="settings" clickable @click="toggle"
						/>
					</template>
					<v-list>
						<template v-for="option in settingsOptions" :key="option.key">
							<v-list-item class="setting-item" @click.stop>
								<div class="setting-label">
									<v-icon v-if="option.icon" :name="option.icon" class="setting-icon" />
									<v-text-overflow :text="option.label" />
								</div>
								<div class="setting-value">
									<v-menu show-arrow placement="right-start" :close-on-content-click="false">
										<template #activator="{ toggle }">
											<button class="setting-label" @click.stop="openChildMenu(option); toggle()">
												<v-icon v-if="getChoiceIcon(option, localValue[option.key])" :name="getChoiceIcon(option, localValue[option.key])" />
												{{ getChoiceText(option, localValue[option.key]) }}
												<v-icon name="arrow_drop_down" />
											</button>
										</template>
										<v-list v-if="activeSettingKey === option.key">
											<v-list-item
												v-for="choice in activeChoices"
												:key="choice.value"
												class="choice-item"
												clickable
												@click="selectChoice(activeSettingKey!, choice.value)"
											>
												<v-icon v-if="choice.icon" :name="choice.icon" />
												{{ choice.text }}
											</v-list-item>
										</v-list>
									</v-menu>
								</div>
							</v-list-item>
						</template>
					</v-list>
				</v-menu>
			</template>
		</v-input>
	</div>
</template>

<style scoped>
.custom-input-with-settings {
	display: flex;
	align-items: center;
}
.custom-input-with-settings .v-input {
	flex-grow: 1;
	margin-right: 8px;
}
.setting-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 12px;
	gap: 8px;
}
.setting-label {
	display: flex;
	align-items: center;
	gap: 8px;
}
.setting-value {
	color: var(--theme--primary);
	font-weight: bold;
	display: flex;
	align-items: center;
}
.setting-value button {
	background: none;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	color: inherit;
	font-weight: inherit;
}
.choice-item {
	padding: 8px 12px;
	display: flex;
	align-items: center;
}
.choice-item .v-icon {
	margin-right: 8px;
}
</style>
