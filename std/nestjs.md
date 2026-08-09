# NestJS 标准

本文件只补充 NestJS 特有规则，并继承 [typescript.md](typescript.md)、[api-design.md](api-design.md)、[database.md](database.md) 与 [security.md](security.md)。

## 适用基线

0. NestJS、TypeScript、运行平台和适配器版本以项目依赖与部署目标为准。
1. 目录、ORM、验证、文档和微服务传输方案沿用项目现状，不固定 TypeORM、Prisma 或 Jest。

## Module 与依赖注入

0. Module 按稳定业务能力组织，只导出下游实际需要的 Provider。
1. Provider 的 singleton、request 和 transient 作用域必须匹配依赖生命周期，避免请求对象污染全局服务。
2. 循环依赖优先通过边界重构、事件或抽取接口消除；`forwardRef` 只作为明确记录的过渡方案。
3. Dynamic Module 和全局 Module 控制导出范围，不把配置与基础设施隐式注入全部模块。
4. DI Token 与反射 DTO 必须保留运行时值；接口使用显式 `@Inject` Token，依赖 metatype 的 DTO 不得仅作 type-only 导入。

## 请求管线

0. Middleware、Guard、Interceptor、Pipe、Filter 各自承担明确职责，避免同一逻辑在多个阶段重复执行。
1. DTO 与 Pipe 负责协议输入验证和转换；写入模型前显式映射允许字段，或按契约配置 `whitelist` / `forbidNonWhitelisted`；转换不能替代领域规则、数据库约束或对象级授权。
2. Guard 不执行无界重 I/O；权限检查需要异步依赖时明确缓存、超时和失败策略。
3. Exception Filter 在应用边界生成稳定错误契约，并保留内部 cause 供受控日志使用。

## 生命周期与数据

0. 实现 `OnModuleInit`、`OnApplicationShutdown` 等 Hook 时，启动和清理必须有界且可重复；进程终止时通过 `enableShutdownHooks()`、显式信号处理或平台等效路径触发清理。
1. 数据访问技术服从项目选择，事务和迁移按 `database.md`；序列化前注意懒加载和 N+1。
2. Config 与秘密使用类型化边界注入，不通过任意 `process.env` 读取散落到业务代码。

## 消息与异步

0. 仅在使用 `@nestjs/microservices` 时定义请求/响应、事件、序列化和版本契约。
1. 消息处理明确幂等、确认、重试、死信和顺序语义，不能把一次 handler 返回当作端到端成功。
2. 后台任务和事件监听器必须有错误观察、关闭和测试路径。

## 测试与陷阱

0. 测试沿用项目工具，覆盖 Module 装配、Provider 作用域、请求管线顺序和真实持久化边界。
1. 常见失效包括循环依赖、请求级 Provider 扩散、Filter/Interceptor 顺序错误和 Guard 中阻塞工作。
2. ORM 懒加载、Class Transformer 与 DTO 映射可能在响应序列化时触发额外查询或泄露字段。
