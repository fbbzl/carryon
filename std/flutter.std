# Flutter 标准

本文件只补充 Flutter / Dart 特有规则，并继承 [frontend.md](frontend.md)、[general.md](general.md) 与 [security.md](security.md)。

## 适用基线

0. Flutter、Dart、目标平台和最低系统版本以项目配置与发布目标为准。
1. 路由、状态管理、网络、序列化和本地存储库沿用项目现有选择，不固定 GoRouter、Riverpod、Dio 等实现。
2. Material、Cupertino 或自定义设计系统依据产品目标选择，并保持同一流程一致。

## Widget 与状态

0. Widget 的输入、状态和副作用边界清晰；能由输入派生的值不重复存入 State。
1. `const`、StatelessWidget 和 Widget 拆分用于表达稳定性与职责，不为减少行数机械拆分。
2. 本地状态保留在最近所有者；跨页面或业务状态再使用项目既有状态方案。
3. `build` 保持可重复且轻量，不执行 I/O、启动订阅或创建需要 dispose 的长期对象。

## 生命周期与异步

0. Controller、FocusNode、Animation、Stream subscription 和其他资源在对应生命周期释放。
1. 异步操作返回后访问 `BuildContext` 或调用 `setState` 前确认 Widget 仍 mounted。
2. 页面离开、应用暂停和任务取消时，明确请求、动画和后台工作的处理方式。
3. Isolate、平台线程和主 isolate 的边界按 CPU/I/O 特征选择，不把同步重计算放在渲染路径。

## 导航、平台与存储

0. 路由参数、Deep Link 和返回结果在边界校验；导航状态与业务状态不要互相隐式依赖。
1. Platform Channel 明确线程、序列化、超时、错误及 Dart/native 跨端取消契约；原生操作不可取消时，使用关联 ID、幂等/对账、迟到结果处理和应用重启恢复控制副作用，并验证 Android/iOS 等目标差异。
2. 本地持久化按数据结构、迁移、加密和恢复需求选择；记录 schema 版本，检测损坏和迁移中断，并定义回滚、重建或安全清理路径；敏感数据遵循平台安全存储能力。

## 性能与测试

0. 用 DevTools 和真实设备数据定位 build、layout、paint、内存和启动瓶颈，再选择优化手段。
1. 长列表使用惰性构建，图片按目标尺寸解码；避免无界缓存和整树无效重建。
2. 单元、Widget、Golden 和集成测试按风险选择，测试工具沿用项目配置；平台、权限、存储或性能变化在受影响真实设备上验证页面离开/超时后的迟到结果、重复调用、进程终止后的恢复，以及迁移失败/损坏恢复和关键行为。

## 常见陷阱

0. 异步完成后 Widget 已 dispose，仍使用 context 或更新状态。
1. Controller、监听器和 Animation 未释放，造成内存泄漏。
2. 在 `build` 中创建 Future、Stream 或长期对象导致重复工作。
3. 无稳定 key 的可重排列表出现状态错位。
4. 只在模拟器验证，遗漏真实设备、权限和平台行为差异。
