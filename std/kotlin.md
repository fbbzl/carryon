# Kotlin/JVM 编码标准

本文件只补充 Kotlin 特有规则。通用工程、安全、数据库和日志要求分别继承 [general.md](general.md)、[security.md](security.md)、[database.md](database.md) 和 [logging.md](logging.md)。Spring 项目再读取 [spring.md](spring.md)。

## 适用基线

0. Kotlin、JVM 与 API 版本以构建配置、Gradle toolchain 和部署目标为准。
1. 协程、序列化、格式化和 lint 工具沿用项目现有选择，不默认要求某个生态库。

## 类型与建模

0. 使用可空类型表达缺失，限制 `!!` 和 `lateinit`；无法避免时说明初始化或非空不变量。
1. 优先 `val`；需要可变状态时控制作用域并说明并发访问方式。
2. `data class`、`value class` 和 sealed hierarchy 只在对应值语义、包装或封闭状态集合成立时使用。
3. 扩展函数用于与接收者紧密相关的行为，不隐藏依赖、I/O 或昂贵操作。
4. Scope functions 以提高局部表达为目标，避免多层嵌套导致接收者含义不清。

## 错误与 Java 互操作

0. 异常、显式结果类型和 sealed 错误模型按边界统一选择，不用 `runCatching` 隐藏取消或严重错误。
1. 包装异常时保留 cause；在应用边界记录和转换一次。
2. Java platform type 进入 Kotlin 边界时尽早确认可空性、集合可变性和注解语义。
3. 面向 Java 的 API 检查默认参数、协变、checked exception 和生成签名的可用性。

## 协程与资源

0. 使用结构化并发，协程必须属于明确 Scope；每个 Scope 声明 fail-fast 或 supervisor 语义、子失败后的同级任务与多错误策略，禁止无所有者的长期 `GlobalScope` 任务。
1. `CancellationException` 必须继续传播；清理逻辑放在 `finally` 或适合取消语义的上下文。
2. 阻塞 I/O 使用合适 Dispatcher 或同步边界，不占用受限协程线程。
3. Flow/Channel 的冷/热语义、背压、共享启动与收集生命周期必须清楚；关闭时定义停止生产/接收顺序及缓冲项排空或放弃计数。

## 工具与测试

0. 格式化和 lint 沿用项目配置，可使用 ktlint、detekt 或 IDE formatter。
1. 测试沿用 JUnit、Kotest 或项目既有框架；协程测试使用可控调度器和虚拟时间，并验证子失败、取消、关闭后无残留协程及目标 JVM/API 兼容。
2. Java/Kotlin 混合模块要验证公开 API 在双方调用端的真实签名。

## 常见陷阱

0. `!!`、未初始化 `lateinit` 和 platform type 引发运行时空指针。
1. 捕获 `CancellationException`、错误 Scope 或阻塞调用造成协程无法取消。
2. `data class` 中可变属性或数组破坏预期值语义。
3. 默认参数若未生成重载，Java 调用方需传全参数；reified inline 和 suspend API 需要专门的 Java 入口或适配层。
4. `equals`、集合元素可变性和委托属性产生隐藏副作用。
