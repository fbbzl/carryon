# Java 编码标准

本文件只补充 Java 特有规则。通用工程、安全、数据库和日志要求分别继承 [general.md](general.md)、[security.md](security.md)、[database.md](database.md) 和 [logging.md](logging.md)。Spring 项目再读取 [spring.md](spring.md)。

## 适用基线

0. JDK 版本、语言级别和运行时以 Maven/Gradle toolchain、构建配置与部署目标为准。
1. 只使用兼容目标支持的语法和 API；`record`、sealed class、模式匹配和虚拟线程不是统一要求。
2. 格式化、静态分析、注解处理和依赖选择沿用项目现有配置。

## 类型与 API

0. 命名遵循 Java 与项目惯例；公共 API 明确可空性、集合可变性和异常契约。
1. 局部变量是否使用 `var` 以可读性为准，不做全局禁止或强制。
2. `Optional` 适合表达返回值缺失，不裸用 `get()`，也不默认用于字段、参数或序列化模型。
3. `record` 只用于值语义和不变量稳定的数据，不替代需要身份或生命周期的实体。
4. `equals`、`hashCode` 和排序规则保持一致；普通对象的值语义使用 `equals` / `Objects.equals`，enum 常量和显式身份比较可使用 `==`。

## 错误与资源

0. 受检异常、运行时异常或显式结果类型按项目边界统一选择；不要逐层记录后原样抛出。
1. 包装异常时保留 cause 和必要上下文，对外边界转换为稳定错误契约。
2. 文件、流、连接和锁使用 try-with-resources 或明确的 finally 清理。
3. 空值注解使用项目统一体系，不把 Spring、Jakarta 或其他注解强加给非对应项目。

## 并发与生命周期

0. 使用受管理的 Executor、`CompletableFuture`、结构化并发或虚拟线程时，以实际 JDK 和运行模型为准。
1. 保留线程中断状态，超时和取消沿调用链传播；后台任务必须有关闭与错误处理路径。
2. 不在数据库事务中等待不可控的外部服务；需要跨系统一致性时使用项目既有模式。
3. 静态可变状态、非线程安全格式化器和共享集合必须有清晰同步策略。

## 工具与测试

0. 构建沿用 Maven 或 Gradle；格式化、Checkstyle、SpotBugs、Error Prone 等只使用项目已配置工具。
1. 测试沿用 JUnit、TestNG 或项目既有框架；并发、事务和序列化边界需要相称的集成验证。
2. Lombok、MapStruct、Hutool 等依赖按项目收益与成本选择，不作为 Java 默认组成。

## 常见陷阱

0. 自动拆箱可空包装类型，或进行未经检查的数值窄化转换，引发异常或溢出。
1. `@PostConstruct`、静态初始化块或类加载期间执行重 I/O。
2. `CompletableFuture` 使用公共线程池、异常未观察或上下文丢失。
3. 可变对象作为 Map key，或 `equals` / `hashCode` 实现不一致。
4. 使用 `SimpleDateFormat` 等非线程安全实例共享状态。
