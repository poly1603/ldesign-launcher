/**
 * Git 工具函数
 *
 * 提供 Git 相关的工具函数
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'fs-extra'

/**
 * Git 信息
 */
export interface GitInfo {
  isGitRepo: boolean
  branch?: string
  commit?: string
  commitShort?: string
  commitMessage?: string
  author?: string
  authorEmail?: string
  timestamp?: Date
  isDirty?: boolean
  remoteName?: string
  remoteUrl?: string
  tags?: string[]
}

/**
 * Git 状态
 */
export interface GitStatus {
  staged: string[]
  unstaged: string[]
  untracked: string[]
  hasChanges: boolean
}

/**
 * 执行 Git 命令
 */
async function execGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      }
      else {
        reject(new Error(stderr || `Git command failed with code ${code}`))
      }
    })

    child.on('error', reject)
  })
}

/**
 * 检查是否为 Git 仓库
 */
export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    await execGit(['rev-parse', '--is-inside-work-tree'], cwd)
    return true
  }
  catch {
    return false
  }
}

/**
 * 获取 Git 信息
 */
export async function getGitInfo(cwd: string): Promise<GitInfo> {
  const isRepo = await isGitRepo(cwd)
  if (!isRepo) {
    return { isGitRepo: false }
  }

  const info: GitInfo = { isGitRepo: true }

  try {
    // 获取当前分支
    info.branch = await execGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)

    // 获取最新提交
    info.commit = await execGit(['rev-parse', 'HEAD'], cwd)
    info.commitShort = info.commit.substring(0, 7)

    // 获取提交信息
    info.commitMessage = await execGit(['log', '-1', '--pretty=%s'], cwd)

    // 获取作者信息
    info.author = await execGit(['log', '-1', '--pretty=%an'], cwd)
    info.authorEmail = await execGit(['log', '-1', '--pretty=%ae'], cwd)

    // 获取时间戳
    const timestamp = await execGit(['log', '-1', '--pretty=%ct'], cwd)
    info.timestamp = new Date(Number.parseInt(timestamp, 10) * 1000)

    // 检查是否有未提交的更改
    const status = await execGit(['status', '--porcelain'], cwd)
    info.isDirty = status.length > 0

    // 获取远程信息
    try {
      info.remoteName = await execGit(['remote'], cwd)
      if (info.remoteName) {
        info.remoteUrl = await execGit(['remote', 'get-url', info.remoteName.split('\n')[0]], cwd)
      }
    }
    catch {
      // 没有远程仓库
    }

    // 获取标签
    try {
      const tags = await execGit(['tag', '--points-at', 'HEAD'], cwd)
      info.tags = tags ? tags.split('\n').filter(Boolean) : []
    }
    catch {
      info.tags = []
    }
  }
  catch {
    // 忽略错误，返回部分信息
  }

  return info
}

/**
 * 获取 Git 状态
 */
export async function getGitStatus(cwd: string): Promise<GitStatus> {
  const result: GitStatus = {
    staged: [],
    unstaged: [],
    untracked: [],
    hasChanges: false,
  }

  try {
    const status = await execGit(['status', '--porcelain'], cwd)
    const lines = status.split('\n').filter(Boolean)

    for (const line of lines) {
      const x = line[0] // index status
      const y = line[1] // work tree status
      const file = line.substring(3)

      if (x === '?' && y === '?') {
        result.untracked.push(file)
      }
      else {
        if (x !== ' ' && x !== '?') {
          result.staged.push(file)
        }
        if (y !== ' ' && y !== '?') {
          result.unstaged.push(file)
        }
      }
    }

    result.hasChanges = result.staged.length > 0
      || result.unstaged.length > 0
      || result.untracked.length > 0
  }
  catch {
    // 不是 Git 仓库或其他错误
  }

  return result
}

/**
 * 获取最近的提交记录
 */
export async function getRecentCommits(
  cwd: string,
  count: number = 10,
): Promise<Array<{
  hash: string
  message: string
  author: string
  date: Date
}>> {
  try {
    const log = await execGit(
      ['log', `-${count}`, '--pretty=format:%H|%s|%an|%ct'],
      cwd,
    )

    return log.split('\n').filter(Boolean).map((line) => {
      const [hash, message, author, timestamp] = line.split('|')
      return {
        hash,
        message,
        author,
        date: new Date(Number.parseInt(timestamp, 10) * 1000),
      }
    })
  }
  catch {
    return []
  }
}

/**
 * 获取当前版本号（从 package.json 或 git tag）
 */
export async function getCurrentVersion(cwd: string): Promise<string | null> {
  // 首先尝试从 package.json 获取
  const pkgPath = path.join(cwd, 'package.json')
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath)
    if (pkg.version) {
      return pkg.version
    }
  }

  // 尝试从 git tag 获取
  try {
    const tag = await execGit(['describe', '--tags', '--abbrev=0'], cwd)
    return tag.replace(/^v/, '')
  }
  catch {
    return null
  }
}

/**
 * 生成构建版本号
 */
export async function generateBuildVersion(cwd: string): Promise<string> {
  const version = await getCurrentVersion(cwd) || '0.0.0'
  const gitInfo = await getGitInfo(cwd)

  if (!gitInfo.isGitRepo) {
    return version
  }

  // 格式: version-commit.dirty
  let buildVersion = `${version}-${gitInfo.commitShort || 'unknown'}`
  if (gitInfo.isDirty) {
    buildVersion += '.dirty'
  }

  return buildVersion
}

/**
 * 检查是否有未推送的提交
 */
export async function hasUnpushedCommits(cwd: string): Promise<boolean> {
  try {
    const result = await execGit(['log', '@{u}..', '--oneline'], cwd)
    return result.length > 0
  }
  catch {
    return false
  }
}

/**
 * 获取文件的最后修改提交
 */
export async function getFileLastCommit(
  cwd: string,
  filePath: string,
): Promise<{ hash: string, message: string, date: Date } | null> {
  try {
    const log = await execGit(
      ['log', '-1', '--pretty=format:%H|%s|%ct', '--', filePath],
      cwd,
    )

    if (!log)
      return null

    const [hash, message, timestamp] = log.split('|')
    return {
      hash,
      message,
      date: new Date(Number.parseInt(timestamp, 10) * 1000),
    }
  }
  catch {
    return null
  }
}
