# Angular 标准

本文件只补充 Angular 特有规则，并继承 [frontend.md](frontend.md)、[typescript.md](typescript.md) 与 [security.md](security.md)。

## 适用基线

0. Angular、TypeScript、构建器和浏览器范围以项目配置与锁文件为准。
1. Standalone API 与 NgModule 都可作为既有架构；新增代码沿用项目方向，不机械迁移。
2. Signals、RxJS、Zone.js 或 zoneless 模式按当前版本和项目状态模型选择。

## 组件与模板

0. 组件输入、输出和查询使用当前版本支持且项目一致的 API；不要直接修改父级传入状态。
1. 模板表达式保持轻量、无副作用；昂贵转换使用计算值、Pipe 或预处理。
2. 列表使用稳定追踪标识，变更检测策略与可变/不可变数据模型一致。
3. 组件创建的订阅、Effect、定时器和 DOM 资源必须绑定销毁生命周期。

## 依赖注入与状态

0. Provider 作用域按实际生命周期选择，避免把请求、页面或组件状态意外提升为全局单例。
1. 非类依赖使用类型安全 Token；运行配置与服务依赖不通过隐藏全局变量读取。
2. 局部状态优先 Signal 或组件状态；跨边界状态再选择服务、RxJS 或项目既有 store。
3. RxJS 流明确冷/热、共享、错误和完成语义，不用 `BehaviorSubject` 作为所有状态的默认容器。

## 路由、表单与 HTTP

0. 路由懒加载、Guard、Resolver 和预加载只在用户流程与性能需要时采用。
1. Guard 改善导航体验但不能替代服务端授权；路由参数在消费前校验。
2. 响应式或模板表单按复杂度选择；校验、异步提交和服务端错误要映射到可见状态。
3. Interceptor 处理真正跨请求的关注点，不把业务规则、全局 Loading 或重试策略全部塞入拦截器。

## 测试与陷阱

0. 使用项目现有 TestBed、组件测试或端到端工具；重点验证输入输出、路由取消/失败、DI 作用域、订阅/Effect 清理及 OnPush/zoneless 异步状态。
1. 避免未销毁的订阅、重复 Effect、错误 Provider 作用域和循环依赖。
2. Signal 与 Observable 互转时检查调度、初始值和销毁行为。
3. OnPush 或 zoneless 模式下，外部回调和可变对象可能不会触发预期更新。
