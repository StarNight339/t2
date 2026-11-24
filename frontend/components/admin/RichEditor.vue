<!-- ตัวแก้ไขเนื้อหาแบบ WYSIWYG (Tiptap) -->
<template>
  <div class="rte">
    <div v-if="editor" class="toolbar">
      <v-btn-toggle density="compact" variant="text" multiple divided>
        <v-btn v-for="b in marks" :key="b.name" :icon="b.icon" size="small" :active="editor.isActive(b.name)" :aria-label="b.label" :title="b.label" @click="b.run()" />
      </v-btn-toggle>
      <v-divider vertical class="mx-1" />
      <v-btn v-for="b in blocks" :key="b.label" :icon="b.icon" size="small" variant="text" :active="b.active()" :aria-label="b.label" :title="b.label" @click="b.run()" />
      <v-divider vertical class="mx-1" />
      <v-btn v-for="a in aligns" :key="a" :icon="`mdi-format-align-${a}`" size="small" variant="text" :active="editor.isActive({ textAlign: a })" :aria-label="`จัด${a}`" @click="editor.chain().focus().setTextAlign(a).run()" />
      <v-divider vertical class="mx-1" />
      <v-btn icon="mdi-link-variant" size="small" variant="text" title="ลิงก์" aria-label="ลิงก์" :active="editor.isActive('link')" @click="setLink" />
      <v-btn icon="mdi-image-plus" size="small" variant="text" title="แทรกรูป" aria-label="แทรกรูป" :loading="busy" @click="pick?.click()" />
      <v-btn icon="mdi-undo" size="small" variant="text" title="ย้อนกลับ" aria-label="ย้อนกลับ" @click="editor.chain().focus().undo().run()" />
      <v-btn icon="mdi-redo" size="small" variant="text" title="ทำซ้ำ" aria-label="ทำซ้ำ" @click="editor.chain().focus().redo().run()" />
      <input ref="pick" type="file" accept="image/*" hidden @change="onImage">
    </div>
    <EditorContent :editor="editor" class="prose content" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'

const props = defineProps<{ modelValue?: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const { uploadFile } = useApi()
const { fail } = useToast()
const pick = ref<HTMLInputElement>()
const busy = ref(false)

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
    Image,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
  ],
  onUpdate: ({ editor }) => emit('update:modelValue', editor.isEmpty ? '' : editor.getHTML()),
})

watch(() => props.modelValue, (v) => {
  if (editor.value && v !== editor.value.getHTML()) editor.value.commands.setContent(v || '', { emitUpdate: false })
})
onBeforeUnmount(() => editor.value?.destroy())

const e = () => editor.value!.chain().focus()
const marks = [
  { name: 'bold', icon: 'mdi-format-bold', label: 'ตัวหนา', run: () => e().toggleBold().run() },
  { name: 'italic', icon: 'mdi-format-italic', label: 'ตัวเอียง', run: () => e().toggleItalic().run() },
  { name: 'underline', icon: 'mdi-format-underline', label: 'ขีดเส้นใต้', run: () => e().toggleUnderline().run() },
  { name: 'strike', icon: 'mdi-format-strikethrough', label: 'ขีดฆ่า', run: () => e().toggleStrike().run() },
]
const blocks = [
  { icon: 'mdi-format-header-2', label: 'หัวข้อ', run: () => e().toggleHeading({ level: 2 }).run(), active: () => !!editor.value?.isActive('heading', { level: 2 }) },
  { icon: 'mdi-format-header-3', label: 'หัวข้อย่อย', run: () => e().toggleHeading({ level: 3 }).run(), active: () => !!editor.value?.isActive('heading', { level: 3 }) },
  { icon: 'mdi-format-list-bulleted', label: 'รายการ', run: () => e().toggleBulletList().run(), active: () => !!editor.value?.isActive('bulletList') },
  { icon: 'mdi-format-list-numbered', label: 'รายการตัวเลข', run: () => e().toggleOrderedList().run(), active: () => !!editor.value?.isActive('orderedList') },
  { icon: 'mdi-format-quote-close', label: 'ข้อความอ้างอิง', run: () => e().toggleBlockquote().run(), active: () => !!editor.value?.isActive('blockquote') },
]
const aligns = ['left', 'center', 'right', 'justify']

function setLink() {
  const prev = editor.value?.getAttributes('link').href || ''
  const url = window.prompt('ใส่ลิงก์ (เว้นว่างเพื่อลบลิงก์)', prev)
  if (url === null) return
  if (!url) e().extendMarkRange('link').unsetLink().run()
  else e().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run()
}

async function onImage(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0]
  if (!f) return
  busy.value = true
  try {
    const up = await uploadFile(f)
    e().setImage({ src: up.url, alt: f.name }).run()
  } catch (err: any) { fail(err.message) } finally {
    busy.value = false
    if (pick.value) pick.value.value = ''
  }
}
</script>

<style scoped>
.rte { border: 1px solid #C9D2DC; border-radius: 8px; overflow: hidden; background: #fff; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 4px 6px; border-bottom: 1px solid #E3E8EE; background: #F7F9FB; position: sticky; top: 0; z-index: 1; }
.content :deep(.ProseMirror) { min-height: 320px; padding: 16px 18px; outline: none; }
.content :deep(img.ProseMirror-selectednode) { outline: 3px solid var(--kb-gold); }
</style>
