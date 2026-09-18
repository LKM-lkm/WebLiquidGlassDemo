# Liquid Glass — 核心算法原理

本文档详细介绍三套液态玻璃渲染算法的物理模型、数学原理与实现细节。

---

## 目录

1. [LiuNian (刘念) — SVG 物理折射](#1-liunian-刘念--svg-物理折射)
2. [Deepika — SVG 渐变位移](#2-deepika--svg-渐变位移)
3. [Kyant — WebGL2 GPU 渲染](#3-kyant--webgl2-gpu-渲染)
4. [算法对比](#4-算法对比)

---

## 1. LiuNian (刘念) — SVG 物理折射

**源文件**: `src/lib/liquid-glass.ts`, `src/lib/glass-logic.ts`  
**参考**: https://liunian.js.org/posts/liquid-glass/

### 1.1 物理模型

核心基于 **斯内尔定律 (Snell's Law)**：光线从空气进入玻璃介质时发生偏折。

```
sin(θᵢ) / sin(θₜ) = n₂ / n₁
```

其中 `n₁ = 1` (空气), `n₂ = IOR` (玻璃折射率，默认 1.52)。

### 1.2 倒角截面曲线 (Bezel Profile)

使用 **squircle 超椭圆** 定义玻璃边缘的弧形截面：

```
f(t) = (1 - (1 - t)⁴)^(1/4),  t ∈ [0, 1]
```

这比圆形截面更接近真实玻璃的 Apple-style 圆角。

### 1.3 折射曲线计算

对倒角曲线上的 128 个采样点：
1. 计算表面法线（数值微分）
2. 应用斯内尔定律求折射方向
3. 投影为标量位移量

```
refract(N) → [dx, dy]  (折射光线方向)
offset = dx * (rayLength / dy)  (投影到位移轴)
```

### 1.4 位移贴图烘焙

生成 RGBA `ImageData`，每个像素编码：
- **R 通道**: X 位移 (128 = 中性/无偏移)
- **G 通道**: Y 位移 (128 = 中性)
- 仅倒角区域的像素有非中性值

关键：使用 `Uint32Array.fill(0xFF008080)` 一次性填充中性值。

### 1.5 高光层

基于 Lambert 光照模型：
```
intensity = |N · L| × edgeGlow^hardness
```
- `N`: 表面法线（从角中心向外）
- `L`: 光源方向（默认 π/3 ≈ 60°）
- `edgeGlow`: 半圆衰减曲线
- `hardness`: 锐利度指数

### 1.6 SVG 滤镜管线

```
SourceGraphic → feGaussianBlur → feDisplacementMap → feColorMatrix(saturate)
                                                      ↓
                                    feImage(specular) → feComposite(in) → feBlend(normal) → feBlend(normal)
```

关键修复：`colorInterpolationFilters="sRGB"` 避免线性色彩空间偏移。

---

## 2. Deepika — SVG 渐变位移

**源文件**: `src/lib/svg/algorithms/deepika.ts`  
**参考**: https://github.com/deepika-builds/liquid-glass

### 2.1 位移贴图生成

纯 Canvas 2D 渐变操作，**无逐像素计算**：

```
1. 水平线性渐变: rgb(0,0,0) → rgb(255,0,0)  (R 通道 = X 位移)
2. 垂直线性渐变: rgb(0,0,0) → rgb(0,0,255)  (B 通道 = Y 位移)
   使用 globalCompositeOperation: "difference" 合成
3. 模糊灰色内缩矩形: rgba(128,128,128,0.93) + roundRect + blur(mapBlur)
   将内部区域中性化，折射效果仅保留在边缘带
```

生成速度：O(1)（仅渐变填充 + 合成操作）

### 2.2 三通道色差

使用 3 次 `feDisplacementMap`，每次不同 scale：
```
scale_R = baseScale
scale_G = baseScale + chroma
scale_B = baseScale + 2 × chroma
```

每个通道用 `feColorMatrix` 隔离 (R/G/B)，然后用 `feBlend(mode="screen")` 叠加。

### 2.3 与 LiuNian 的关键差异

| 方面 | LiuNian | Deepika |
|------|---------|---------|
| 位移贴图 | 逐像素 Snell's Law 计算 | Canvas 渐变 + 模糊矩形 |
| 物理精度 | 高（squircle 截面 + 法线） | 无物理模型 |
| 色散 | 无 | 3 通道交错色差 |
| 高光 | Lambert 光照 + 边缘辉光 | 无（依赖 CSS box-shadow） |
| 生成速度 | O(w×h) | O(1) |

---

## 3. Kyant — WebGL2 GPU 渲染

**源文件**: `src/lib/webgl/`  
**参考**: Martin 的 Kyant WebGL 移植 (https://github.com/martin65536/liquid-glass-webgl)

### 3.1 渲染管线

4 通道 GPU 管线：
```
Pass 1: 场景纹理上传 → sceneFBO
Pass 2: 水平高斯模糊 → blurFBO
Pass 3: 垂直高斯模糊 → blurFBO (完整模糊结果)
Pass 4: 玻璃效果着色器 → canvas (SDF + 折射 + 色散 + 高光)
```

### 3.2 SDF 形状系统

使用 **有符号距离场 (Signed Distance Function)** 定义玻璃形状：

```glsl
float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
```

SDF 梯度提供表面法线方向。

### 3.3 circleMap() 折射

```glsl
vec2 circleMap(vec2 uv, vec2 grad, float height) {
  return uv + grad * height / uResolution;
}
```

- `grad`: SDF 梯度（表面法线方向）
- `height`: 折射强度，随距边缘距离衰减
- UV 沿法线方向偏移采样背景

### 3.4 色散

每个颜色通道使用略微不同的折射率：
```glsl
const float N_R = 0.98;  // 短波长弯曲更多
const float N_G = 1.0;
const float N_B = 1.02;
```

### 3.5 菲涅尔反射

```glsl
float fresnel = pow(1.0 - edgeNorm, 4.0);
color += vec3(fresnel * 0.3);
```

在 LCH 色彩空间中操作（保色相提亮）。

### 3.6 各向异性高光

```glsl
float glareAngle = (atan(grad.y, grad.x) - PI/4 + uHighlightAngle) * 2.0;
float glare = pow(0.5 + sin(glareAngle) * 0.5, 1.5) * glareGeo * uHighlightIntensity;
```

基于法线角度的正弦调制产生方向性高光带。

---

## 4. 算法对比

| 特性 | LiuNian | Deepika | Kyant |
|------|---------|---------|-------|
| 渲染后端 | SVG filter | SVG filter | WebGL2 |
| 折射模型 | Snell's Law | 渐变斜坡 | circleMap + SDF |
| 色散 | 无 | 3 通道 | 多通道 |
| 高光 | Lambert + 边缘辉光 | 无 | 各向异性 glare |
| 菲涅尔 | 无 | 无 | 有 (LCH 色彩空间) |
| 模糊 | SVG feGaussianBlur | SVG feGaussianBlur | GPU 高斯 (2-pass) |
| 形状定义 | CSS border-radius | CSS border-radius | SDF (可动态变形) |
| 性能 | CPU (逐像素烘焙) | CPU (O(1) 生成) | GPU (实时着色器) |
| 浏览器支持 | Chromium only | Chromium only | 所有 WebGL2 |

---

## 5. 共同技术要点

### sRGB 色彩空间锁定

所有 SVG 滤镜必须设置 `colorInterpolationFilters="sRGB"`。默认的 `linearRGB` 会将中性灰 128 映射到 ~0.216，注入恒定的伪位移。

### DPR 处理

设备像素比上限为 2x。更高 DPR 的设备在 2x 下已足够清晰，而 3x 会使位移贴图像素量膨胀 4 倍（从 2x 的 400×200 到 3x 的 600×300），增加 CPU 开销且视觉收益递减。

### ResizeObserver 防抖

所有组件使用 120ms 防抖的 `ResizeObserver`，避免快速尺寸变化时的过度重绘。