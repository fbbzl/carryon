# TypeScript 编码标准

本文件只补充 TypeScript 特有规则。通用工程、安全、数据库和日志要求分别继承 [general.md](general.md)、[security.md](security.md)、[database.md](database.md) 和 [logging.md](logging.md)。前端或 NestJS 项目再读取对应规范。

## 适用基线

0. TypeScript、ECMAScript、Node.js 或浏览器目标以 `tsconfig`、`package.json`、锁文件和部署环境为准。
1. 包管理器、模块格式、formatter 和 lint 工具沿用仓库现有配置，不统一强制 pnpm、ESM 或特定库。

## 类型与边界

0. 对项目代码启用与现状相称的 strict 选项；新增代码不得依赖隐式 `any` 掩盖未知结构。
1. 不可信数据进入系统时以 `unknown` 接收并做运行时校验；类型断言不能替代验证。
2. `any` 仅作为局部兼容逃生口，必须限制范围并说明原因；公共契约不能泄漏 `any`。
3. 使用 discriminated union、`never` 和完整分支检查表达封闭状态，避免互相冲突的可选字段。
4. `null` 与 `undefined` 的语义在项目内保持一致，并在序列化边界明确。

## 异步与资源

0. Promise 必须被 `await`、返回或显式交给受管理后台流程；并发组合明确首个/多个 rejection、同级取消和部分成功副作用，禁止无人观察的 rejection。
1. 超时和取消使用 `AbortSignal` 或项目等效机制沿调用链传播；超时返回或发出 abort 不代表底层操作已停止，所有者仍需观察并等待其终态。
2. 事件监听、流、定时器和订阅在生命周期结束时清理。
3. Node.js 与浏览器 API 的资源、权限和全局对象不同，不能依赖错误运行目标的隐式能力。

## 错误与模块

0. 抛出的值应规范化为 `Error` 或项目错误类型；捕获变量按未知值处理。
1. 可预期业务结果可使用显式结果类型，未捕获异常在应用边界统一转换并记录一次。
2. 避免循环依赖和仅为副作用的隐式导入；type-only import 用于减少不必要运行时耦合。
3. Date、BigInt、Map、Set 和 class 实例跨 JSON 边界时明确转换规则。

## 工具与测试

0. 使用项目锁文件和指定包管理器保证依赖可重复；新增依赖检查浏览器/Node 目标与打包影响。
1. 测试沿用 Vitest、Jest、Node test runner 或项目既有框架；运行时验证覆盖无效输入、停止接收与流/定时器排空或中止、无生命周期后更新/未处理 rejection 及目标运行时 API 兼容。
2. 构建、类型检查与测试分别验证不同风险，不能用编译通过替代运行时验证。

## 常见陷阱

0. `typeof null === "object"`、数组与普通对象判断混淆。
1. `JSON.parse`、环境变量和网络响应未经运行时校验就断言类型。
2. async 函数漏写 `await`、浮动 Promise 或取消后继续更新状态。
3. `Date` 的可变性、时区和字符串解析依赖运行环境。
4. `any`、双重断言或宽泛索引签名绕过类型系统。
