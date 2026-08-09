# Scala 编码标准

本文件只补充 Scala 特有规则。通用工程、安全、数据库和日志要求分别继承 [general.md](general.md)、[security.md](security.md)、[database.md](database.md) 和 [logging.md](logging.md)。

## 适用基线

0. Scala 版本、JVM 目标和编译选项以 `build.sbt`、Mill、Scala CLI 或项目构建配置为准。
1. Scala 2 与 Scala 3 的语法、库和二进制兼容边界分别处理，不默认要求迁移或使用全部新特性。
2. Cats、ZIO、Akka/Pekko、Circe 等生态库只在项目已经采用或收益明确时使用。

## 类型与建模

0. `Option` 表达缺失，`Either`、`Try` 或效果类型表达失败；Java 互操作边界尽早处理 `null`。
1. case class、enum / sealed hierarchy 和模式匹配用于封闭领域状态，并检查分支完整性。
2. 默认使用不可变集合和值；需要可变状态时限制作用域并明确并发模型。
3. given/implicit、扩展方法和类型类应让依赖更清晰，禁止隐藏昂贵 I/O 或业务副作用。
4. 高阶抽象服务于重复问题；单次业务流程不为追求纯度强制引入 tagless final 或效果系统。

## 错误与资源

0. 同一边界选择一致错误通道，不混合异常、`Either` 和效果错误而无转换规则。
1. 非致命异常转换时保留 cause；线程中断、取消和致命错误不应被通用捕获吞掉。
2. 文件、连接和订阅使用 `Using`、bracket/resource 或项目等效机制覆盖释放路径。
3. Future 和效果任务的失败必须被组合、返回或观察，不能静默启动。

## 并发与执行

0. `ExecutionContext`、调度器和阻塞线程池显式来源明确，不默认使用全局执行上下文承载阻塞 I/O。
1. Future、IO/ZIO 和 actor 模型之间的边界明确取消、超时和上下文传播。
2. 共享可变状态优先改为消息、不可变值或受控引用；锁和原子变量仅保护清晰不变量。

## 工具与测试

0. 格式化、lint 和构建沿用项目配置，可使用 scalafmt、scalafix、sbt 或 Mill。
1. 测试沿用 ScalaTest、MUnit、Specs2 或项目既有框架；属性测试用于适合生成验证的不变量。
2. 跨 Scala/JVM 版本发布的库要验证二进制兼容与消费者矩阵。

## 常见陷阱

0. 隐式使用全局 `ExecutionContext` 执行阻塞工作。
1. `null`、Java 集合或 platform API 绕过 Scala 类型不变量。
2. 隐式转换、given 搜索或复杂类型推导使调用行为不可见。
3. Future / 效果任务未返回，异常无人观察或取消失效。
4. 非尾递归处理无界输入导致栈溢出。
