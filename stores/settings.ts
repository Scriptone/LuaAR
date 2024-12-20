export type CodeLanguage = "lua" | "typescript" | "html" | "css" | "json"
export const useSettingsStore = defineStore(
	"settings",
	() => {
		const loc = ref(200)
		const defaultLanguage = ref<CodeLanguage>("lua")
		const languages = ref<CodeLanguage[]>(["lua", "typescript", "html", "css", "json"])
		return {
			loc,
			defaultLanguage,
			languages,
		}
	},
	{
		persist: true,
	}
)
