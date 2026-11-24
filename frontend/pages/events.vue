<template>
  <div>
    <PageHeader title="ปฏิทินกิจกรรม" :crumbs="[{ title: 'ปฏิทินกิจกรรม' }]" />
    <div class="container-x">
      <div class="d-flex align-center justify-center ga-4 mb-6">
        <v-btn icon="mdi-chevron-left" variant="tonal" aria-label="เดือนก่อน" @click="shift(-1)" />
        <h2 class="month-label">{{ monthLabel }}</h2>
        <v-btn icon="mdi-chevron-right" variant="tonal" aria-label="เดือนถัดไป" @click="shift(1)" />
        <v-btn variant="text" color="primary" @click="cursor = startOfMonth(new Date())">เดือนนี้</v-btn>
      </div>

      <v-row>
        <!-- ตารางเดือน -->
        <v-col cols="12" md="7">
          <v-card elevation="1" class="pa-3">
            <div class="cal">
              <div v-for="w in weekdays" :key="w" class="cal-head">{{ w }}</div>
              <button
                v-for="(d, i) in cells" :key="i"
                class="cal-cell" :class="{ muted: !d.inMonth, today: d.isToday, has: d.events.length, sel: d.key === selected }"
                :disabled="!d.inMonth" @click="selected = selected === d.key ? '' : d.key"
              >
                <span class="num">{{ d.date.getDate() }}</span>
                <span v-if="d.events.length" class="dots">
                  <i v-for="n in Math.min(d.events.length, 3)" :key="n" />
                </span>
              </button>
            </div>
          </v-card>
        </v-col>

        <!-- รายการ -->
        <v-col cols="12" md="5">
          <div class="d-flex align-center mb-3">
            <h3 class="section-title mb-0">{{ selected ? thaiDateLong(selected) : 'กิจกรรมทั้งเดือน' }}</h3>
            <v-spacer />
            <v-btn v-if="selected" size="small" variant="text" @click="selected = ''">ดูทั้งเดือน</v-btn>
          </div>
          <div v-if="shown.length" class="d-flex flex-column ga-3">
            <v-card v-for="e in shown" :key="e.id" elevation="1" class="pa-4 event">
              <div class="text-caption text-primary font-weight-medium">
                {{ thaiDate(e.start_at) }}<span v-if="!e.is_all_day"> · {{ timeOf(e.start_at) }}</span>
                <span v-if="e.end_at && e.end_at.slice(0, 10) !== e.start_at.slice(0, 10)"> – {{ thaiDate(e.end_at) }}</span>
              </div>
              <div class="font-head font-weight-medium mt-1">{{ e.title }}</div>
              <div v-if="e.description" class="text-body-2 text-medium-emphasis mt-1">{{ e.description }}</div>
              <div class="d-flex flex-wrap ga-3 text-caption text-medium-emphasis mt-2">
                <span v-if="e.location"><v-icon size="14" icon="mdi-map-marker-outline" /> {{ e.location }}</span>
                <span v-if="e.department_name"><v-icon size="14" icon="mdi-domain" /> {{ e.department_name }}</span>
              </div>
              <v-btn v-if="e.post_slug" :to="`/news/${e.post_slug}`" size="small" variant="tonal" color="primary" class="mt-3">อ่านข่าว</v-btn>
            </v-card>
          </div>
          <v-card v-else elevation="0" class="text-center text-medium-emphasis py-10 border">ไม่มีกิจกรรม</v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

const cursor = ref(startOfMonth(new Date()))
const selected = ref('')
const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const range = computed(() => {
  const c = cursor.value
  return { from: keyOf(c), to: keyOf(new Date(c.getFullYear(), c.getMonth() + 1, 0)) }
})
const { data } = await useFetch<any>('/api/events', { query: computed(() => ({ ...range.value, all: 1 })) })
const events = computed<any[]>(() => data.value?.items || [])

const monthLabel = computed(() => cursor.value.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }))
const cells = computed(() => {
  const c = cursor.value
  const first = new Date(c.getFullYear(), c.getMonth(), 1 - c.getDay())
  const today = keyOf(new Date())
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i)
    const key = keyOf(date)
    return {
      date, key,
      inMonth: date.getMonth() === c.getMonth(),
      isToday: key === today,
      events: events.value.filter((e) => e.start_at.slice(0, 10) <= key && (e.end_at || e.start_at).slice(0, 10) >= key),
    }
  })
})
const shown = computed(() => (selected.value ? cells.value.find((c) => c.key === selected.value)?.events || [] : events.value))

function shift(n: number) {
  selected.value = ''
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + n, 1)
}

useSeoMeta({ title: 'ปฏิทินกิจกรรม' })
</script>

<style scoped>
.month-label { font-size: 1.35rem; font-weight: 500; min-width: 190px; text-align: center; color: var(--kb-navy); }
.cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-head { text-align: center; font-size: .85rem; padding: 6px 0; color: #607D8B; }
.cal-cell { aspect-ratio: 1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: #F7F9FB; transition: background .15s; }
.cal-cell:hover:not(:disabled) { background: #E8EEF5; }
.cal-cell.muted { opacity: .35; }
.cal-cell.today .num { background: var(--kb-gold); color: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
.cal-cell.has { background: #E6EEF8; font-weight: 600; }
.cal-cell.sel { outline: 2px solid var(--kb-navy); }
.dots { display: flex; gap: 3px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--kb-navy); }
.event { border-left: 4px solid var(--kb-gold); border-radius: 0 8px 8px 0 !important; }
</style>
