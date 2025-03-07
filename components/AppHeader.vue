<template>
	<header class="mb-4">
		<v-toolbar color="transparent" floating elevation="4" density="compact">
			<v-toolbar-title class="ma-0">
				<v-btn variant="text" class="font-weight-bold text-h5" :active="false" :to="{ name: 'index' }"
					>AR Atlas</v-btn
				>
			</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-toolbar-items>
				<v-btn icon="mdi-home-outline" :to="{ name: 'index' }" />
				<v-btn icon="mdi-comment-text-outline" :to="{ name: 'reviews' }" />
				<!-- <v-btn icon="mdi-file-document-outline" :to="{ name: 'HD' }" /> -->
				<v-btn icon="mdi-shield-account-outline" :to="{ name: 'moderation' }" />
				<v-btn icon="mdi-cog-outline" @click="openSettings = true" />

				<v-tooltip location="bottom">
					<template #activator="{ props }">
						<v-btn
							v-bind="props"
							:icon="download === 100 ? 'mdi-check' : 'mdi-download-outline'"
							:color="download === 100 ? 'success' : 'primary'"
							@click="updateApplication"
							v-if="(available && download === null) || download === 100" />

						<v-progress-circular
							v-bind="props"
							class="mx-2 align-self-center"
							:indeterminate="download === 0"
							v-else-if="download !== null"
							:model-value="download"
							size="24" />
					</template>
					Update Available {{ update?.version }}
				</v-tooltip>
			</v-toolbar-items>
		</v-toolbar>

		<SettingsDialog v-model="openSettings" />
	</header>
</template>

<script lang="ts" setup>
import { relaunch } from "@tauri-apps/plugin-process"
import { check, Update } from "@tauri-apps/plugin-updater"
import { toast } from "vuetify-sonner"

const openSettings = ref(false)
let update: Update | null = null
const available = ref(false)
const download = ref<number | null>(null)

const updateApplication = async () => {
	if (!update) {
		return
	}
	try {
		let downloaded = 0
		let contentLength = 0

		await update.download((event) => {
			switch (event.event) {
				case "Started":
					contentLength = event.data.contentLength || 0
					download.value = 0
					break
				case "Progress":
					downloaded += event.data.chunkLength || 0
					download.value = (downloaded / contentLength) * 100
					break
				case "Finished":
					download.value = 100
					break
			}
		})

		await new Promise((resolve) => setTimeout(resolve, 1000))
		await update.install()
		await relaunch()
	} catch (error) {
		console.log("failed to update", error)
		toast.error("Failed to update")
	}
}

const updateAvailable = async () => {
	try {
		update = await check()
		available.value = !!update

		if (!update) setTimeout(updateAvailable, 30000)
	} catch (error) {
		console.log("failed to check for updates", error)
		toast.error("Failed to check for updates")
	}
}
onMounted(updateAvailable)
</script>

<style scoped></style>
