# Nuxt 3 / Vue 3 集成指南

本项目的核心算法脱离了 React 依赖，可以在 Nuxt 3 (Vue 3) 中复用。本文档基于 v2.0 架构更新。

---

## 1. 可复用的核心模块

以下模块是框架无关的 TypeScript，可直接移植：

| 模块 | 路径 | 用途 |
|------|------|------|
| **LiuNian 算法** | `src/lib/liquid-glass.ts` | SVG 物理折射 (Snell's Law) |
| **Deepika 算法** | `src/lib/svg/algorithms/deepika.ts` | SVG 渐变位移 + 色差 |
| **物理计算** | `src/lib/glass-logic.ts` | 折射曲线、位移贴图、高光层 |
| **WebGL 渲染器** | `src/lib/webgl/` | WebGL2 GPU 渲染管线 |

---

## 2. SVG 算法集成 (LiuNian / Deepika)

### 2.1 全局滤镜容器

在 `app.vue` 底部添加 SVG defs 挂载点：

```vue
<template>
  <div>
    <NuxtPage />
    <svg style="width:0;height:0;position:absolute;pointer-events:none" aria-hidden="true">
      <defs id="liquid-glass-defs" />
    </svg>
  </div>
</template>
```

### 2.2 LiuNian 组件

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
// 从 src/lib/liquid-glass.ts 移植
import { liquidGlass, type LiquidGlassInstance } from '~/lib/liquid-glass'

const props = defineProps<{
  id: string
  width?: number | string
  height?: number | string
  params?: Record<string, number>
}>()

const containerRef = ref<HTMLElement | null>(null)
const glassRef = ref<HTMLElement | null>(null)
let instance: LiquidGlassInstance | null = null

const initGlass = () => {
  if (!glassRef.value) return
  instance?.destroy()
  instance = liquidGlass(glassRef.value, {
    radius: props.params?.radius ?? 20,
    blur: props.params?.blur ?? 4,
    thickness: props.params?.thickness ?? 60,
    edgeWidth: props.params?.edgeWidth ?? 25,
    ior: props.params?.ior ?? 1.52,
    specularOpacity: props.params?.specularOpacity ?? 0.4,
    specularHardness: props.params?.specularHardness ?? 2,
    backdropSaturation: props.params?.backdropSaturation ?? 1.2,
  })
}

onMounted(initGlass)
onBeforeUnmount(() => instance?.destroy())
watch(() => props.params, initGlass, { deep: true })
</script>

<template>
  <div ref="containerRef" class="relative inline-block" :style="{ width, height }">
    <div ref="glassRef" class="absolute inset-0 overflow-hidden pointer-events-none z-0"
         :style="{ borderRadius: params?.radius + 'px' }" />
    <div class="relative z-10 overflow-hidden" :style="{ borderRadius: params?.radius + 'px' }">
      <slot />
    </div>
  </div>
</template>
```

### 2.3 Deepika 组件

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { deepikaGlass, type DeepikaInstance } from '~/lib/svg/algorithms/deepika'

const props = defineProps<{
  id: string
  width?: number | string
  height?: number | string
  params?: { radius?: number; blur?: number; saturate?: number }
}>()

const glassRef = ref<HTMLElement | null>(null)
let instance: DeepikaInstance | null = null

onMounted(() => {
  if (!glassRef.value) return
  instance = deepikaGlass(glassRef.value, {
    scale: -112,
    chroma: 6,
    border: 0.07,
    mapBlur: 12,
    blur: props.params?.blur ?? 3,
    saturate: props.params?.saturate ?? 1.5,
    radius: props.params?.radius,
  })
})

onBeforeUnmount(() => instance?.destroy())
</script>

<template>
  <div class="relative inline-block" :style="{ width, height }">
    <div ref="glassRef" class="absolute inset-0 overflow-hidden pointer-events-none z-0"
         :style="{ borderRadius: params?.radius + 'px' }" />
    <div class="relative z-10 overflow-hidden" :style="{ borderRadius: params?.radius + 'px' }">
      <slot />
    </div>
  </div>
</template>
```

---

## 3. WebGL 算法集成 (Kyant)

WebGL 渲染器需要 Canvas overlay，不能使用 `backdrop-filter`。

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { GlassRenderer } from '~/lib/webgl/renderer'

const props = defineProps<{
  id: string
  sceneUrl: string
  params?: Record<string, number>
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let renderer: GlassRenderer | null = null

onMounted(async () => {
  if (!canvasRef.value) return
  renderer = new GlassRenderer(canvasRef.value)
  // 加载场景图片
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const dpr = Math.min(window.devicePixelRatio, 2)
    const w = containerRef.value!.offsetWidth * dpr
    const h = containerRef.value!.offsetHeight * dpr
    canvas.width = w; canvas.height = h
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
    renderer!.uploadScene(canvas, w, h)
    renderer!.render({
      rectX: 0, rectY: 0, rectW: containerRef.value!.offsetWidth, rectH: containerRef.value!.offsetHeight,
      radius: props.params?.radius ?? 20, dpr,
      refractionHeight: props.params?.refractionHeight ?? 15,
      ior: props.params?.ior ?? 1.5,
      chromaticAberration: props.params?.chromaticAberration ?? 3,
      blurMix: 0.6, blurRadius: props.params?.blur ?? 8,
      vibrancy: props.params?.vibrancy ?? 0.5,
      tintR: 0.95, tintG: 0.97, tintB: 1.0, tintAmount: 0.15,
      highlightIntensity: 0.5, highlightAngle: 0,
      shadowExpand: 20, shadowOffsetY: 4,
      tintColorR: 0, tintColorG: 0, tintColorB: 0, tintOpacity: 0,
    })
  }
  img.src = props.sceneUrl
})

onBeforeUnmount(() => renderer?.destroy())
</script>

<template>
  <div ref="containerRef" class="relative inline-block">
    <canvas ref="canvasRef" class="absolute inset-0 z-0 pointer-events-none"
            style="width:100%;height:100%" />
    <div class="relative z-10"><slot /></div>
  </div>
</template>
```

---

## 4. 集成注意事项

### SVG 算法
- 仅在 Chromium 浏览器中生效（Safari/Firefox 自动回退到 `backdrop-filter: blur()`）
- 需要在 `app.vue` 中放置 SVG `<defs>` 容器
- `liquid-glass.ts` 和 `glass-logic.ts` 是纯 TypeScript，无 React 依赖

### WebGL 算法
- 所有支持 WebGL2 的浏览器均可工作
- 需要 Canvas overlay（不能用 `backdrop-filter`）
- 场景图片需要同源或配置 CORS
- `renderer.ts` 和 `core.ts` 是纯 TypeScript，无 React 依赖

### 通用
- 所有算法模块使用 TypeScript 编写，类型定义完整
- DPR 上限为 2x（平衡性能和清晰度）
- ResizeObserver 防抖 120ms