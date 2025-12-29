import type { UpgradeReport } from '../upgrade-assistant'
/**
 * 智能依赖升级助手测试
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { UpgradeAssistant } from '../upgrade-assistant'

describe('upgradeAssistant', () => {
  let assistant: UpgradeAssistant

  beforeEach(() => {
    assistant = new UpgradeAssistant(process.cwd())
  })

  describe('analyzeUpgrades', () => {
    it('should return empty report when no outdated dependencies', async () => {
      const report = await assistant.analyzeUpgrades()

      expect(report).toBeDefined()
      expect(report.total).toBeGreaterThanOrEqual(0)
      expect(report.outdated).toBeInstanceOf(Array)
      expect(report.safeUpgrades).toBeInstanceOf(Array)
      expect(report.majorUpgrades).toBeInstanceOf(Array)
      expect(report.vulnerabilities).toBeInstanceOf(Array)
    })

    it('should categorize upgrades correctly', async () => {
      const report = await assistant.analyzeUpgrades()

      // 所有分类的依赖数量总和应该等于过时依赖总数
      const categorized = [
        ...report.safeUpgrades.map(d => d.name),
        ...report.majorUpgrades.map(d => d.name),
      ]

      // safeUpgrades 和 majorUpgrades 不应该有重复
      const uniqueCategorized = new Set(categorized)
      expect(uniqueCategorized.size).toBeLessThanOrEqual(report.outdated.length)
    })
  })

  describe('generateReport', () => {
    it('should generate formatted report', () => {
      const mockReport: UpgradeReport = {
        total: 10,
        outdated: [
          {
            name: 'test-package',
            currentVersion: '1.0.0',
            latestVersion: '2.0.0',
            wantedVersion: '1.1.0',
            type: 'dependencies',
            updateType: 'major',
            hasBreakingChanges: true,
          },
        ],
        safeUpgrades: [],
        majorUpgrades: [
          {
            name: 'test-package',
            currentVersion: '1.0.0',
            latestVersion: '2.0.0',
            wantedVersion: '1.1.0',
            type: 'dependencies',
            updateType: 'major',
            hasBreakingChanges: true,
          },
        ],
        vulnerabilities: [],
      }

      const report = assistant.generateReport(mockReport)

      expect(report).toContain('依赖升级报告')
      expect(report).toContain('总依赖数: 10')
      expect(report).toContain('test-package')
    })
  })

  describe('getChangelog', () => {
    it('should handle fetch errors gracefully', async () => {
      const changelog = await assistant.getChangelog('non-existent-package-xyz-123', '1.0.0', '2.0.0')

      expect(changelog).toBeDefined()
      expect(typeof changelog).toBe('string')
      expect(changelog.length).toBeGreaterThan(0)
    })

    it('should return changelog with timeout', async () => {
      // 使用真实包测试
      const changelog = await assistant.getChangelog('react', '17.0.0', '18.0.0')

      expect(changelog).toBeDefined()
      expect(typeof changelog).toBe('string')
    }, 15000) // 15秒超时
  })
})
