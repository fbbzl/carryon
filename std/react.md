# React 标准

本文件只补充 React 特有规则，并继承 [frontend.md](frontend.md)、[typescript.md](typescript.md) 与 [security.md](security.md)。

## 适用基线

0. React、渲染框架、路由和构建工具以项目依赖与运行目标为准。
1. Client/Server Component、并发能力和编译优化只在所用框架与版本支持时采用。
2. 状态、数据请求、表单和样式库沿用项目现有选择，不在通用规范中指定。

## 渲染与组件

0. Render 保持纯函数语义，不在渲染阶段执行 I/O、订阅或修改外部状态。
1. Props、state 和 context 的所有权清晰，不直接修改已有对象以触发更新。
2. 列表 key 表达稳定身份，不能用会随排序或过滤变化的索引代替实体身份。
3. Server 与 Client 边界只传可序列化、必要的数据，不把服务端秘密带入客户端；框架支持的 Server Function 引用视为可调用服务端边界，必须重新校验输入、认证和对象级授权。

## Hooks 与副作用

0. Hooks 只在组件或自定义 Hook 顶层调用，并遵守项目启用的 lint 规则。
1. Effect 用于与外部系统同步，不用于可在 render 中计算的派生状态。
2. Effect 的依赖、清理和竞态必须正确；异步请求处理取消或过期结果。
3. 自定义 Hook 暴露稳定、可理解的契约，不用 Hook 隐藏全局副作用。

## 状态与性能

0. 状态保存在最小必要层级；Context 适合低频共享依赖，不默认替代所有状态方案。
1. 基于旧 state 更新时使用函数式更新，确保批处理和并发渲染下语义正确。
2. `memo`、`useMemo`、`useCallback` 和虚拟列表以测量结果为依据，不能把缓存当默认样板。
3. 外部 Store 与并发渲染协作时使用框架支持的订阅接口，避免 tearing 和陈旧快照。

## 错误与测试

0. Error Boundary 只能处理其覆盖的渲染错误；事件、异步和服务端错误另行处理。
1. 测试以用户可观察行为为主，并覆盖 Effect 清理、异步竞态和错误恢复。
2. 测试工具沿用项目已有选择，不固定 Vitest、Jest 或 Testing Library 组合。

## 常见陷阱

0. Effect 依赖不完整、闭包陈旧或 Strict Mode 下重复执行暴露非幂等副作用。
1. 在 render 中无条件更新 state，或把 props 派生值重复存入 state。
2. 不稳定 key 导致组件状态错配，过度 memo 反而增加比较和维护成本。
3. 请求较晚返回覆盖新状态，或组件卸载后仍更新外部资源。
