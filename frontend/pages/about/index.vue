<script setup lang="ts">
// /about -> เปิดหน้าแรกของหมวดเกี่ยวกับวิทยาลัย
const { data: site } = await useSite()
const first = site.value?.pages?.[0]
await navigateTo(first ? `/about/${first.slug}` : '/', { replace: true })
</script>

<template><div /></template>
