<template>
	<div>
		<v-row dense>
			<v-col cols="12" sm="4">
				<v-text-field
					v-model="search"
					label="Search"
					prepend-inner-icon="mdi-magnify"
					single-line
					hide-details
					class="mb-2"
					density="compact"
					variant="solo-filled" />
			</v-col>
			<v-col cols="12" sm="2">
				<v-combobox
					v-model="selectedRoles"
					single-line
					multiple
					density="compact"
					hide-details
					variant="solo-filled"
					:items="roles"
					label="Filter by Role"
					clearable />
			</v-col>
			<v-col cols="12" sm="3">
				<v-combobox
					v-model="selectedSkills"
					multiple
					single-line
					density="compact"
					hide-details
					variant="solo-filled"
					:items="settingsStore.skills"
					label="Filter by Skill"
					clearable />
			</v-col>
			<v-col cols="12" sm="3">
				<v-combobox
					density="compact"
					single-line
					hide-details
					variant="solo-filled"
					v-model="selectedUser"
					:items="users"
					label="Filter by User"
					clearable></v-combobox>
			</v-col>
			<v-col>
				<v-btn @click="showSkills = !showSkills" color="primary" prepend-icon="mdi-filter">
					{{ showSkills ? "Show by Skills" : "Show by Readers" }}
				</v-btn>
			</v-col>
		</v-row>

		<v-data-table
			v-show="showSkills"
			density="compact"
			multi-sort
			:search="search"
			:headers="skillHeaders"
			:items="filteredSkills"
			:sort-by="[{ key: 'readers', order: 'desc' }]">
			<template #item.readers="{ item }">
				<v-chip-group>
					<v-chip v-if="'readers' in item" v-for="reader in item.readers" :key="reader" class="mr-2">{{
						reader
					}}</v-chip>
				</v-chip-group>
			</template>
		</v-data-table>

		<v-data-table
			v-show="!showSkills"
			density="compact"
			multi-sort
			:search="search"
			:headers="headers"
			:items="filteredReaders"
			:sort-by="sortBy">
			<template #item.skills="{ item }">
				<v-chip-group column>
					<v-chip
						v-if="'skills' in item"
						v-for="skill in item.skills"
						:key="skill"
						class="mr-2 font-weight-bold skill-chip"
						variant="tonal"
						@click="selectSkill(skill)"
						:style="{ backgroundColor: `${skillRoleColors?.get(skill)}` }"
						>{{ skill }}</v-chip
					>
				</v-chip-group>
			</template>
		</v-data-table>
	</div>
</template>

<script lang="ts" setup>
export interface Reader {
	user_id: bigint
	skills: Skill[]
	role: "AR" | "SAR" | "Management" | "Head"
	name: string
	timezone: string
}

const settingsStore = useSettingsStore()
const readers = ref<Reader[]>([
	{
		user_id: 623238907772796961n,
		skills: ["Lua", "Voice Actor", "Video Editor", "JavaScript"],
		name: "LifeDigger",
		timezone: "",
		role: "SAR",
	},
	{
		user_id: 326078015727599616n,
		skills: ["Lua", "Python", "JavaScript"],
		name: "Scriptone",
		timezone: "Europe/Brussels",
		role: "AR",
	},
	{
		user_id: 1010290469235871785n,
		skills: ["Lua", "C#", "C++"],
		name: "Dottik",
		timezone: "America/Barbados",
		role: "AR",
	},
	{
		user_id: 650283793374249011n,
		skills: ["Lua", "HTML/CSS", "JavaScript"],
		name: "Ashlyn",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 302058196896579584n,
		skills: ["Lua"],
		name: "Optimized",
		timezone: "Asia/Kolkata",
		role: "SAR",
	},
	{
		user_id: 1143575748427382848n,
		skills: ["3D Modeler", "Graphics Artist"],
		name: "Akio",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 999018383817326723n,
		skills: ["Graphics Artist"],
		name: "Austin",
		timezone: "",
		role: "SAR",
	},
	{
		user_id: 661556544466583553n,
		skills: ["Interface Designer"],
		name: "Bordoma",
		role: "AR",
		timezone: "",
	},
	{
		user_id: 269724942180941824n,
		skills: [
			"Lua",
			"Interface Designer",
			"Texture Artist",
			"Music Composer",
			"3D Modeler",
			"Clothing",
			"Graphics Artist",
			"Animator",
		],
		role: "AR",
		name: "daisy",
		timezone: "",
	},
	{
		user_id: 381337534556274689n,
		skills: ["Builder"],
		name: "souleth",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 879313965790920764n,
		skills: ["Builder", "Terrain Editor", "Interface Designer", "Graphics Artist"],
		name: "Parra",
		timezone: "America/Belize",
		role: "SAR",
	},
	{
		user_id: 552477847751753739n,
		skills: ["Builder", "Interface Designer", "Clothing", "Graphics Artist"],
		name: "Lettuce",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 352387677149986818n,
		skills: [
			"Builder",
			"Terrain Editor",
			"Interface Designer",
			"Voice Actor",
			"Sound Effects",
			"HTML/CSS",
			"Python",

			"Music Composer",
			"3D Modeler",
			"Video Editor",
			"Graphics Artist",
			"Texture Artist",
			"Visual Effects",
		],
		name: "Aero",
		timezone: "Asia/Kolkata",
		role: "Head",
	},
	{
		user_id: 524139654719471616n,
		skills: ["Builder", "3D Modeler"],
		name: "Gator",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 886355963894988801n,
		skills: ["Interface Designer", "Graphics Artist"],
		name: "jonahxo",
		timezone: "America/Los_Angeles",
		role: "Management",
	},
	{
		user_id: 488164549027954708n,
		skills: ["3D Modeler", "Animator"],
		name: "Shehatesaddy",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 610544677904449673n,
		skills: ["3D Modeler", "Clothing", "Graphics Artist"],
		name: "Romaxino",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 766558323084230697n,
		skills: ["Clothing"],
		name: "Dan",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 118496586299998209n,
		skills: ["Java"],
		name: "Solo",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 222804393030844438n,
		skills: ["PHP"],
		name: "Volvic",
		timezone: "",
		role: "AR",
	},
	{
		user_id: 533903312551149588n,
		skills: ["Voice Actor", "Graphics Artist"],
		name: "a1exmechanic101",
		timezone: "",
		role: "AR",
	},
])

const showSkills = ref(false)
const search = ref("")

const roles = ref<string[]>(["AR", "SAR", "Management", "Head"])
const users = ref<string[]>(readers.value.map((reader) => reader.name))
const selectedRoles = ref<string[]>([])
const selectedSkills = ref<Skill[]>([])
const selectedUser = ref<string | null>(null)
const sortBy = ref([{ key: "role", order: "desc" as const }])

const headers = [
	{ title: "Name", key: "name", value: (reader: Reader) => `${reader.name} (${reader.user_id})` },

	//sort should be by index of the role in the roles array
	{ title: "Role", key: "role", sort: (a: string, b: string) => roles.value.indexOf(a) - roles.value.indexOf(b) },
	{ title: "Skills", key: "skills", sort: (a: Skill[], b: Skill[]) => a.length - b.length },
]

const skillHeaders = [
	{ title: "Skill", key: "skill" },
	{ title: "Readers", key: "readers", sort: (a: Skill[], b: Skill[]) => a.length - b.length },
]

const filteredReaders = computed(() => {
	return readers.value.filter((reader) => {
		const matchesRole = selectedRoles.value.length ? selectedRoles.value.includes(reader.role) : true
		const matchesSkill = selectedSkills.value.length
			? selectedSkills.value.some((skill) => reader.skills.includes(skill))
			: true
		const matchesUser = selectedUser.value ? reader.name === selectedUser.value : true
		return matchesRole && matchesUser && matchesSkill
	})
})

const filteredSkills = computed(() => {
	const skillsMap: Record<string, string[]> = {}

	readers.value.forEach((reader) => {
		reader.skills.forEach((skill) => {
			if (!skillsMap[skill]) {
				skillsMap[skill] = []
			}
			skillsMap[skill].push(reader.name)
		})
	})

	return Object.entries(skillsMap).map(([skill, readers]) => ({ skill, readers }))
})

const ctrlHeld = ref(false)

const selectSkill = (skill: Skill) => {
	if (ctrlHeld.value) {
		openInBrowser(
			`https://hiddendevs.com/phpjs/applications_JS?offset=1&type=${skillToVolvic.get(skill)}&filterTag=None`
		)
	} else {
		selectedSkills.value = [skill]
	}
}

const onKeyDown = (e: KeyboardEvent) => {
	if (e.key === "Control") {
		ctrlHeld.value = true
	}
}

const onKeyUp = (e: KeyboardEvent) => {
	if (e.key === "Control") {
		ctrlHeld.value = false
	}
}

onMounted(() => {
	window.addEventListener("keydown", onKeyDown)
	window.addEventListener("keyup", onKeyUp)
})

onUnmounted(() => {
	window.removeEventListener("keydown", onKeyDown)
	window.removeEventListener("keyup", onKeyUp)
})
</script>

<style lang="scss" scoped>
.skill-chip {
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
}
</style>
