/**
 * 可选部署模块的类型声明
 * 
 * 这些模块是可选依赖，用户只有在需要特定功能时才需安装
 */

// ssh2-sftp-client - SFTP 部署支持
declare module 'ssh2-sftp-client' {
  export interface ConnectConfig {
    host: string
    port?: number
    username: string
    password?: string
    privateKey?: Buffer | string
    passphrase?: string
  }

  export default class SftpClient {
    connect(config: ConnectConfig): Promise<void>
    exists(remotePath: string): Promise<string | false>
    mkdir(remotePath: string, recursive?: boolean): Promise<string>
    rmdir(remotePath: string, recursive?: boolean): Promise<string>
    put(localPath: string, remotePath: string, options?: object): Promise<string>
    get(remotePath: string, localPath: string, options?: object): Promise<string>
    list(remotePath: string): Promise<Array<{ name: string; type: string; size: number }>>
    end(): Promise<void>
  }
}

// node-ssh - SSH/SCP 部署支持
declare module 'node-ssh' {
  export interface SSHConfig {
    host: string
    port?: number
    username: string
    password?: string
    privateKey?: string
    passphrase?: string
  }

  export interface ExecResult {
    stdout: string
    stderr: string
    code: number
  }

  export interface PutDirectoryOptions {
    recursive?: boolean
    concurrency?: number
    validate?: (itemPath: string) => boolean
    tick?: (localPath: string, remotePath: string, error?: Error) => void
  }

  export class NodeSSH {
    connect(config: SSHConfig): Promise<this>
    execCommand(command: string, options?: { cwd?: string }): Promise<ExecResult>
    putDirectory(localPath: string, remotePath: string, options?: PutDirectoryOptions): Promise<boolean>
    putFile(localPath: string, remotePath: string): Promise<void>
    dispose(): void
  }
}

// basic-ftp - FTP 部署支持
declare module 'basic-ftp' {
  export interface AccessOptions {
    host: string
    port?: number
    user?: string
    password?: string
    secure?: boolean | 'implicit'
  }

  export class Client {
    ftp: { verbose: boolean }
    access(options: AccessOptions): Promise<void>
    ensureDir(remotePath: string): Promise<void>
    clearWorkingDir(): Promise<void>
    uploadFrom(localPath: string, remotePath: string): Promise<void>
    downloadTo(localPath: string, remotePath: string): Promise<void>
    close(): void
  }
}
