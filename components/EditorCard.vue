<template>
	<v-card>
		<v-card-title>
			<div class="title-content">
				<!-- Title input -->
				<v-text-field
					prefix="Editor"
					persistent-placeholder
					v-model="editor.title"
					:readonly="isLintResult"
					variant="solo"
					label="Title"
					placeholder="Enter title"
					density="compact"
					prepend-inner-icon="mdi-text"
					single-line
					hide-details />
				<!-- Language select -->
				<v-select
					:model-value="editor.lang || settingsStore.defaultLanguage"
					@update:model-value="editor.lang = $event"
					:items="settingsStore.languages"
					label="Language"
					variant="solo"
					single-line
					max-width="12rem"
					class="flex-xl-0-0"
					density="compact"
					prepend-inner-icon="mdi-code-tags"
					hide-details />
				<v-checkbox v-model="editor.selected" density="compact" hide-details>
					<v-tooltip activator="parent" location="bottom">Select Editor</v-tooltip>
				</v-checkbox>
			</div>

			<VToolbar flat color="transparent">
				<v-btn-group variant="tonal" color="primary" v-if="!isLintResult">
					<v-btn @click="editorStore.stripCode(editor)" :disabled="editor.input === ''"> Strip Code </v-btn>
					<v-btn @click="formatCode(editor)" :disabled="editor.input === ''"> Format Code </v-btn>
					<!-- Remove logs -->
					<v-btn @click="editorStore.removeLogs(editor)" :disabled="editor.input === ''">
						Remove Logs
						<v-tooltip activator="parent" location="bottom">Remove all prints, warns, and errors</v-tooltip>
					</v-btn>
					<!-- Lint -->
					<v-btn
						@click="editorStore.lintCode(editor)"
						:disabled="editor.input === '' || !tauri || editor.lang !== 'lua'">
						Lint Code
					</v-btn>
				</v-btn-group>
				<v-spacer />
				<v-btn-group variant="elevated">
					<v-btn icon @click="editorStore.toggleCollapse(editor)">
						<v-icon>{{ editor.collapsed ? "mdi-chevron-down" : "mdi-chevron-up" }}</v-icon>
						<v-tooltip activator="parent" location="bottom">{{
							editor.collapsed ? "Expand" : "Collapse"
						}}</v-tooltip>
					</v-btn>
					<v-btn icon @click="editorStore.removeEditor(editor)">
						<v-icon>mdi-close</v-icon>
						<v-tooltip activator="parent" location="bottom">Remove Editor</v-tooltip>
					</v-btn>
					<!-- Duplicate -->
					<v-btn icon @click="duplicateEditor">
						<v-icon>mdi-content-copy</v-icon>
						<v-tooltip activator="parent" location="bottom">Duplicate Editor</v-tooltip>
					</v-btn>
				</v-btn-group>
			</VToolbar>
		</v-card-title>
		<v-expand-transition>
			<v-card-text v-if="!editor.collapsed">
				<div class="code-info-chips" v-if="!isLintResult">
					<CodeInfoChip
						v-if="codeInfoCount.definitive.length > 0"
						:count="codeInfoCount.definitive.length"
						color="error"
						text="Deprecated API found"
						:details="codeInfoCount.definitive" />
					<CodeInfoChip
						v-if="codeInfoCount.warning.length > 0"
						:count="codeInfoCount.warning.length"
						color="warning"
						text="Warning: Deprecated API found"
						:details="codeInfoCount.warning" />
					<CodeInfoChip
						v-if="codeInfoCount.incorrect.length > 0"
						:count="codeInfoCount.incorrect.length"
						color="error"
						text="Incorrect API usage"
						:details="codeInfoCount.incorrect" />

					<!-- LOC -->
					<CodeInfoChip :count="loc" :color="loc < settingsStore.loc ? 'warning' : 'success'" text="LOC" />

					<!-- LINT -->
					<CodeInfoChip
						v-if="lintResult"
						:count="lintCount"
						:color="lintCount == 0 ? 'success' : lintCount < 10 ? 'warning' : 'error'"
						:details="lintResultMessages"
						text="Lint" />

					<!-- Comments -->
					<CodeInfoChip
						:count="comments"
						:color="comments <= 30 ? 'error' : comments <= 50 ? 'warning' : 'success'"
						text="Comments" />

					<CodeInfoChip
						v-if="codeInfoCount.info.length > 0"
						v-for="(info, index) in codeInfoCount.info"
						:key="index"
						:count="null"
						color="info"
						:text="info" />
				</div>

				<MonacoEditor
					ref="monacoEditor"
					:options="{
						theme: 'vs-dark',
						dropIntoEditor: {
							enabled: true,
							showDropSelector: 'afterDrop',
						},
						formatOnPaste: true,
						formatOnType: true,
						minimap: {
							enabled: false,
						},
						autoIndent: 'full',
						cursorBlinking: 'smooth',
						cursorSmoothCaretAnimation: 'on',
						lineNumbers: 'on',
						mouseWheelZoom: true,
					}"
					:lang="editor.lang || settingsStore.defaultLanguage"
					v-model="editor.input"
					class="editor" />
			</v-card-text>
		</v-expand-transition>
	</v-card>
</template>

<script lang="ts" setup>
import { toast } from "vuetify-sonner"

const tauri = isTauri()
const editorStore = useEditorStore()
const settingsStore = useSettingsStore()
const monacoEditor = useTemplateRef("monacoEditor")

const props = defineProps<{
	editor: Editor
}>()

const isLintResult = computed(() => props.editor.title?.toLowerCase().includes("lint"))
const deprecatedAPI = ref([
	/^\s*(wait|delay|spawn)\s*(\([^\)]*\))?\s*$/i,
	/\bSetPrimaryPartCFrame\b/i,
	/\bgame\.Chat\b/i,
	/\bGetService\s*\(\s*["']Chat["']\s*\)/i,
])

const warnDeprecatedAPI = ref([
	/^\s*LoadAnimation\s*(\([^\)]*\))?\s*$/i,
	/\bBodyVelocity\b/i,
	/\bBodyGyro\b/i,
	/\bBodyPosition\b/i,
	/\bBodyAngularVelocity\b/i,
	/\bBodyThrust\b/i,
	/\bBodyForce\b/i,
	/\bLoadAnimation\b/i,
])

const incorrectAPI = ref([/\bFindFirst\w*\s*\([^\)]*\)\s*[:.]/i, /Instance\.new\s*\(\s*[^,]+,\s*[^)]+\s*\)/i])

const loc = computed(() => stripLoggingStatements(stripInput(props.editor), props.editor.lang).split("\n").length)
const lintResult = ref<LintResult | null>(null)
const lintCount = computed(() =>
	lintResult.value ? Object.values(lintResult.value.summary).reduce((a, b) => a + b, 0) : 0
)
const lintResultMessages = computed(() => {
	if (!lintResult.value) return []
	//LintResult .details has record of string, {message: string}, show all messages
	return Object.values(lintResult.value.details)
		.map((detail) => detail.flatMap((d) => `${d.lineNumber}: ${d.message}`))
		.flat()
})
const comments = computed(() => countComments(props.editor))
const codeInfoCount = computed(() => {
	const strippedInput = stripInput(props.editor)

	return {
		definitive: strippedInput.split("\n").filter((line) => deprecatedAPI.value.some((regex) => regex.test(line))),
		warning: strippedInput.split("\n").filter((line) => warnDeprecatedAPI.value.some((regex) => regex.test(line))),
		incorrect: strippedInput.split("\n").filter((line) => incorrectAPI.value.some((regex) => regex.test(line))),
		info: [
			`Code has ${countWhitelines(props.editor)} whitelines`,
			`Code has ${countLogs(props.editor)} logs`,
		].filter((_) => _ !== null),
	}
})

const duplicateEditor = (event: MouseEvent) => {
	if (event.ctrlKey) return navigator.clipboard.writeText(props.editor.input)

	editorStore.editors.push({ ...props.editor })
}

const formatCode = async (editor: Editor) => {
	monacoEditor.value?.$editor?.getAction("editor.action.formatDocument")?.run()
	if (editor.lang !== "lua") return
	if (!tauri) return toast.error("Could not format code")

	editorStore.formatCode(editor)
}

const init = ref(true)
const onInit = async () => {
	console.log("onInit")
	// await nextTick()
	if (!props.editor.input) return
	if (props.editor.lang !== "lua") return
	if (!tauri) return toast.error("Could not format code")
	init.value = false

	await editorStore.formatCode(props.editor)
	const result = await processLintResult(props.editor)

	lintResult.value = result
}

onMounted(async () => {
	init.value = true
	await nextTick()

	monacoEditor.value?.$editor?.onDidPaste(onInit)
})
watch(
	() => props.editor.input,
	() => {
		if (!init.value) return
		onInit()
	},
	{
		flush: "post",
		immediate: true,
	}
)
</script>

<style scoped lang="scss">
.editor {
	width: 100%;
	height: 85vh;
}

.title-content {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

.v-toolbar :deep(div) {
	justify-content: space-between;
}

.v-btn {
	margin: 0 5px;
	border-radius: 0;
}

.code-info-chips {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
}
</style>
