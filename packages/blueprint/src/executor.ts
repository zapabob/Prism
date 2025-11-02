/**
 * @prism/blueprint - Executor
 * 
 * Blueprint実行エンジン
 */

import type {
  Blueprint,
  BlueprintStep,
  TaskResult,
  ScoringMetrics,
  SuccessCriteria
} from '@prism/types'

/**
 * Blueprint Executor
 * 
 * 複雑なマルチステップワークフローを実行
 */
export class BlueprintExecutor {
  /**
   * Blueprintを実行
   * 
   * @param blueprint - Blueprint定義
   * @returns 実行結果リスト
   * @throws Error - ステップ失敗または成功条件未達成時
   */
  async execute(blueprint: Blueprint): Promise<TaskResult[]> {
    const results: TaskResult[] = []
    
    console.log(`Executing blueprint: ${blueprint.name} v${blueprint.version}`)
    
    for (const step of blueprint.steps) {
      console.log(`Executing step ${step.id}: ${step.description}`)
      
      const result = await this.executeStep(step, blueprint)
      results.push(result)
      
      if (!result.success) {
        throw new Error(`Blueprint step ${step.id} failed: ${result.error ?? 'Unknown error'}`)
      }
      
      // Success Criteria検証
      const criteriaPass = await this.validateCriteria(step, result)
      if (!criteriaPass) {
        throw new Error(`Step ${step.id} did not meet success criteria`)
      }
    }
    
    console.log(`Blueprint ${blueprint.name} completed successfully`)
    return results
  }

  /**
   * ステップを実行
   * 
   * @param step - Blueprintステップ
   * @param blueprint - Blueprint定義
   * @returns タスク結果
   */
  private async executeStep(
    step: BlueprintStep,
    _blueprint: Blueprint
  ): Promise<TaskResult> {
    const startTime = Date.now()
    
    // Agent選択
    const agent = step.agent ?? this.selectAgent(step.type)
    
    // TODO: 実際のMCP経由でAgent実行
    // 現在はモックとして成功を返す
    const output = `Executed step: ${step.description}`
    const metrics = this.generateMetrics(step)
    
    return {
      stepId: step.id,
      agentType: agent,
      success: true,
      output,
      metrics,
      duration: Date.now() - startTime
    }
  }

  /**
   * 成功条件を検証
   * 
   * @param step - Blueprintステップ
   * @param result - タスク結果
   * @returns すべての条件を満たす場合true
   */
  private async validateCriteria(
    step: BlueprintStep,
    result: TaskResult
  ): Promise<boolean> {
    for (const criteria of step.successCriteria) {
      const passed = this.checkCriteria(criteria, result.metrics)
      if (!passed) {
        console.log(
          `Criteria failed: ${criteria.metric} ${criteria.operator} ${criteria.value}`
        )
        return false
      }
    }
    
    return true
  }

  /**
   * 単一成功条件をチェック
   * 
   * @param criteria - 成功条件
   * @param metrics - メトリクス
   * @returns 条件を満たす場合true
   */
  private checkCriteria(
    criteria: SuccessCriteria,
    metrics: ScoringMetrics
  ): boolean {
    const metricValue = metrics[criteria.metric as keyof ScoringMetrics]
    
    if (typeof metricValue !== 'number') {
      return false
    }
    
    const targetValue =
      typeof criteria.value === 'number'
        ? criteria.value
        : parseFloat(criteria.value)
    
    if (isNaN(targetValue)) {
      return false
    }
    
    const operator = criteria.operator
    
    if (operator === 'gt') {
      return metricValue > targetValue
    } else if (operator === 'gte') {
      return metricValue >= targetValue
    } else if (operator === 'lt') {
      return metricValue < targetValue
    } else if (operator === 'lte') {
      return metricValue <= targetValue
    } else {
      // eq
      return metricValue === targetValue
    }
  }

  /**
   * ステップ種別からAgentを選択
   * 
   * @param type - ステップ種別
   * @returns Agent名
   */
  private selectAgent(type: string): string {
    const agentMap: Record<string, string> = {
      code: 'CodeExpert',
      test: 'TestingExpert',
      review: 'CodeReviewer',
      research: 'DeepResearcher',
      custom: 'General'
    }
    
    return agentMap[type] ?? 'General'
  }

  /**
   * モックメトリクスを生成
   * 
   * TODO: 実際のAgent実行からメトリクスを取得
   * 
   * @param step - Blueprintステップ
   * @returns スコアリングメトリクス
   */
  private generateMetrics(_step: BlueprintStep): ScoringMetrics {
    return {
      testSuccessRate: 1.0,
      lintPassRate: 1.0,
      performanceGain: 0.0,
      changeRisk: 0.1,
      readabilityScore: 0.8,
      securityScore: 0.9
    }
  }
}

/**
 * ヘルパー: Blueprintを実行
 * 
 * @param blueprint - Blueprint定義
 * @returns 実行結果リスト
 */
export async function executeBlueprint(blueprint: Blueprint): Promise<TaskResult[]> {
  const executor = new BlueprintExecutor()
  return await executor.execute(blueprint)
}

