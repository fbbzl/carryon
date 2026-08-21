# FastAPI 标准

本文件只补充 FastAPI 特有规则，并继承 [python.md](python.md)、[api-design.md](api-design.md)、[database.md](database.md) 与 [security.md](security.md)。

## 适用基线

0. FastAPI、Starlette、Pydantic、ASGI Server 和 Python 版本以项目依赖与部署目标为准。
1. 路由、Service、Schema 和持久层目录沿用项目现状，不固定 SQLAlchemy 或统一分层模板。

## 路由与 Schema

0. `APIRouter`、路径和依赖按领域或能力组织，路由顺序避免动态路径遮蔽具体路径。
1. 请求与响应模型准确表达可空、默认、别名和序列化语义；外部模型与持久化实体不必共用。
2. `response_model`、状态码和错误处理与实际响应一致，确保生成的 OpenAPI 可作为当前契约。
3. 上传、流式响应和大请求设置大小、超时、临时资源与断开处理。

## 依赖与生命周期

0. `Depends` 表达请求范围依赖和横切能力，不把复杂业务流程拆成难追踪的依赖图。
1. Generator / async generator 依赖必须在 `yield` 后正确释放 Session、连接和锁。
2. 应用级资源使用 lifespan 管理启动和关闭；启动失败不得留下半初始化全局状态。
3. 依赖 override 仅用于测试边界，测试结束后恢复，避免跨用例污染。

## 同步与异步

0. `def` 路由适合阻塞同步库，`async def` 适合真正异步调用链；不要求所有路由和外部调用统一 async。
1. async 路径不得直接执行长时间阻塞 I/O 或 CPU 工作；需要时使用线程池、任务队列或进程边界。
2. 取消、客户端断开和超时必须传播到下游资源，避免连接或任务泄漏。
3. `BackgroundTasks` 只适合进程内短任务，不作为需要持久化、重试或强交付保证的队列；其失败必须可观察，存在外部副作用时仍需幂等或补偿。

## 错误、安全与测试

0. 异常处理器在 HTTP 边界转换领域错误和验证错误，不泄露堆栈或敏感上下文。
1. 认证依赖之后仍需对象级授权；OpenAPI 中的安全声明必须与运行时检查一致。
2. 测试沿用 TestClient、HTTPX 或项目工具；显式验证客户端断开/超时、后台任务失败、lifespan 关闭与异步资源无残留，以及生产数据库差异。

## 常见陷阱

0. 在 `async def` 中调用同步数据库或网络库阻塞事件循环。
1. Generator 依赖没有执行清理，导致 Session 或连接泄漏。
2. 后台任务异常无人观察，进程重启后任务静默丢失。
3. Pydantic 输入、输出或 ORM 转换配置不一致，生成文档与真实响应漂移。
