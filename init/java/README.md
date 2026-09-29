# Java 初始化说明

## D 盘路径基线

| 路径 | 版本 | 来源 |
|------|------|------|
| `D:\Java\openjdk\java-se-8u44-ri` | Java 8 | Eclipse Temurin |
| `D:\Java\openjdk\jdk-11.0.0.2` | Java 11 | Eclipse Temurin |
| `D:\Java\openjdk\jdk-17.0.0.1` | Java 17 | Eclipse Temurin |
| `D:\Java\openjdk\jdk-21` | Java 21 | Eclipse Temurin |

## 下载地址

推荐从 **Adoptium (Eclipse Temurin)** 下载 LTS 版本，免费且可商用：

| 版本 | Adoptium 下载页 | 直接下载（x64 Windows） |
|------|----------------|------------------------|
| **JDK 21 LTS** | https://adoptium.net/temurin/releases/?version=21 | `OpenJDK21U-jdk_x64_windows_hotspot_21.*.zip` |
| **JDK 17 LTS** | https://adoptium.net/temurin/releases/?version=17 | `OpenJDK17U-jdk_x64_windows_hotspot_17.*.zip` |
| **JDK 11 LTS** | https://adoptium.net/temurin/releases/?version=11 | `OpenJDK11U-jdk_x64_windows_hotspot_11.*.zip` |
| **JDK 8 LTS** | https://adoptium.net/temurin/releases/?version=8 | `OpenJDK8U-jdk_x64_windows_hotspot_8u*.zip` |

替代来源（Oracle 需注册账号）：
- Oracle JDK: https://www.oracle.com/java/technologies/downloads/
- Oracle OpenJDK: https://jdk.java.net/（仅最新版）

## 初始化步骤

1. 运行 `..\setup.ps1 -Mode Restore -Tools java`。
2. 脚本从 Adoptium API 下载 Java 8、11、17、21 的当前 GA 更新版。
3. 脚本保留现有目录名，以兼容 VS Code 的多版本终端配置。
4. 脚本设置 `JAVA_HOME` 指向 `D:\Java\openjdk\jdk-21`，其余版本通过 VS Code profile 切换。

## 注意

- 所有 JDK 以 `D:\Java\openjdk` 下的实际目录为准。
- 目录名是兼容路径，不代表重新下载后的精确补丁版本；实际版本以 `java -version` 为准。
- 当前主要使用 **JDK 21**，`JAVA_HOME` 和 VS Code 默认配置指向 `D:\Java\openjdk\jdk-21`。
- 多版本共存时，通过切换 `JAVA_HOME` 环境变量选择活跃版本。
- 旧版本（Java 8）仅用于兼容旧项目。
