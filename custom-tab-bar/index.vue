<template>
	<AppTabBar ref="tabBar" />
</template>

<script>
import AppTabBar from '@/components/AppTabBar.vue';

export default {
	components: { AppTabBar },
	methods: {
		setSelected(index) {
			this.$refs.tabBar?.setSelected(index);
		}
	}
};
</script>
