# Django 标准

本文件只补充 Django 特有规则，并继承 [python.md](python.md)、[api-design.md](api-design.md)、[database.md](database.md) 与 [security.md](security.md)。

## 适用基线

0. Django、Python、数据库、WSGI/ASGI 和可选 DRF 版本以项目依赖与部署目标为准。
1. App、Model、Service 和目录边界沿用项目现状；业务方法放 Model 还是应用 Service 必须一致且可测试。
2. Celery、缓存、DRF 和管理后台仅在项目实际使用时应用相关规则。

## Model 与 QuerySet

0. Model 约束、唯一性、关系和删除行为表达真实数据不变量，不能只依赖表单或 Serializer 校验。
1. 明确 QuerySet 的求值点；依赖事务内快照或锁语义时，不得把求值延迟到事务边界之外。
2. 关联访问根据真实查询使用 `select_related`、`prefetch_related` 或显式查询，并验证查询数量。
3. 自定义 Manager / QuerySet 保持可组合，不把请求或用户上下文藏进全局状态。

## 请求与权限

0. View、Class-Based View 或 ViewSet 按项目风格选择，负责协议适配而非承载全部业务规则。
1. Form/Serializer 执行结构与字段校验，领域不变量和并发一致性仍由业务与数据库边界保证。
2. DRF permission、Django auth 和对象级权限共同覆盖资源访问；前端和路由隐藏不能代替授权。
3. 错误响应、分页和版本遵循项目 API 契约，不强制统一包装。

## 事务、信号与任务

0. `transaction.atomic` 围绕需要原子保证的业务操作，避免事务内远程 I/O 和无界工作。
1. Signal 只处理低耦合、短小副作用；关键业务流程和重任务使用显式调用。
2. 后台任务必须幂等并记录重试、超时、重复执行和失败恢复；不默认绑定 Celery。
3. `on_commit` 用于只应在提交成功后触发的外部动作；提交成功不等于投递成功，高风险动作还要有可对账的投递记录、重试/补偿和失败恢复。
4. 使用 Celery 或等效队列时，明确生产者、Broker 与 Worker 的投递所有权，以及 ack 时点、visibility/lease、prefetch、revoke/取消、重试/DLQ 和停消费后的有界排空；业务副作用与重投必须以幂等、去重或对账闭环。

## 配置、迁移与测试

0. `SECRET_KEY`、数据库凭据和敏感设置按安全规范注入；生产不得开启 `DEBUG`。
1. Migration 与代码按兼容顺序发布，数据迁移验证耗时、锁和恢复策略。
2. 测试沿用 Django TestCase、pytest-django 或项目工具，并使用与生产行为相称的数据库验证关键查询；异步副作用覆盖提交后投递失败、业务执行前后与 ack 前后崩溃、lease 超时重投、Worker 关闭排空和恢复对账。

## 常见陷阱

0. Serializer、模板或 admin 展示时触发 N+1 与意外 QuerySet 求值。
1. Signal 递归、重复注册或在事务提交前产生不可逆副作用。
2. 测试数据库与生产数据库差异掩盖约束、锁和查询问题。
3. ASGI 路径中调用同步阻塞代码，或错误共享连接与请求状态。
