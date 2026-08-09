# Vue 标准

本文件只补充 Vue 特有规则，并继承 [frontend.md](frontend.md)、[typescript.md](typescript.md) 与 [security.md](security.md)。

## 适用基线

0. Vue、编译器、路由、SSR 框架和浏览器范围以项目依赖与配置为准。
1. Composition API、Options API 与 `<script setup>` 沿用项目方向，不为形式统一机械迁移。
2. Pinia、Vue Router、请求和表单库只在项目已采用或需求明确时使用。

## 组件与响应式

0. Props 只读，更新通过 emit、model 契约或共享状态完成；不得直接修改传入对象掩盖单向数据流。
1. `ref`、`reactive`、`computed` 和 `watch` 按数据语义选择，派生值优先 `computed`。
2. 解构响应式对象时保持响应性；需要时使用 `toRef` / `toRefs` 或项目等效写法。
3. 列表 key 表达稳定身份，模板表达式保持轻量且无副作用。

## Composable 与状态

0. Composable 管理一组相关响应式能力，并明确创建的订阅、监听和资源如何释放。
1. Composable 不隐藏意外全局单例；共享状态的作用域必须与应用、请求或组件生命周期一致。
2. Store 只保存共享源状态，避免复制可计算数据和形成 Store 间循环依赖。
3. SSR 中不得把用户级可变状态放进跨请求共享单例。

## 生命周期与路由

0. 定时器、DOM 事件、Observer、订阅和请求在卸载或作用域结束时清理。
1. `watch` 明确数据源、flush 时机和竞态处理，不用深度监听替代数据建模。
2. 路由 Guard 只控制前端导航，服务端仍需授权；异步 Guard 必须完成或明确取消。
3. KeepAlive、Teleport 和 Suspense 改变生命周期时，验证激活、停用和错误路径。

## 测试与陷阱

0. 测试工具沿用项目配置，重点验证 Props/Emits、响应式更新、路由和资源清理。
1. 避免不稳定 key、直接修改 Props、丢失响应性和未清理监听。
2. `watchEffect` 隐式依赖过多会使触发原因不可判断。
3. SSR hydration 依赖时间、随机数或客户端专有 API 时可能产生不一致。
