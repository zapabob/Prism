/**
 * @prism/blueprint - Validator
 * 
 * Blueprint検証システム
 */

import type { Blueprint, BlueprintStep } from '@prism/types'

/**
 * 検証エラー
 */
export interface ValidationError {
  /** エラー種別 */
  type: 'missing_field' | 'invalid_format' | 'cyclic_dependency' | 'unknown_agent'
  /** エラーメッセージ */
  message: string
  /** ステップID（ステップレベルのエラーの場合） */
  stepId?: string
}

/**
 * 検証結果
 */
export interface ValidationResult {
  /** 検証成功フラグ */
  valid: boolean
  /** エラーリスト */
  errors: ValidationError[]
}

/**
 * Blueprint Validator
 * 
 * Blueprint定義の妥当性を検証
 */
export class BlueprintValidator {
  /**
   * Blueprintを検証
   * 
   * @param blueprint - Blueprint定義
   * @returns 検証結果
   */
  validate(blueprint: Blueprint): ValidationResult {
    const errors: ValidationError[] = []
    
    // 必須フィールドチェック
    errors.push(...this.validateRequiredFields(blueprint))
    
    // ステップ検証
    errors.push(...this.validateSteps(blueprint.steps))
    
    // 循環依存チェック
    if (this.hasCyclicDependencies(blueprint.steps)) {
      errors.push({
        type: 'cyclic_dependency',
        message: 'Cyclic dependencies detected in blueprint steps'
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 必須フィールドを検証
   */
  private validateRequiredFields(blueprint: Blueprint): ValidationError[] {
    const errors: ValidationError[] = []
    
    if (!blueprint.id || blueprint.id.trim() === '') {
      errors.push({
        type: 'missing_field',
        message: 'Blueprint id is required'
      })
    }
    
    if (!blueprint.name || blueprint.name.trim() === '') {
      errors.push({
        type: 'missing_field',
        message: 'Blueprint name is required'
      })
    }
    
    if (!blueprint.version || blueprint.version.trim() === '') {
      errors.push({
        type: 'missing_field',
        message: 'Blueprint version is required'
      })
    }
    
    if (!blueprint.steps || blueprint.steps.length === 0) {
      errors.push({
        type: 'missing_field',
        message: 'Blueprint must have at least one step'
      })
    }
    
    return errors
  }

  /**
   * ステップを検証
   */
  private validateSteps(steps: BlueprintStep[]): ValidationError[] {
    const errors: ValidationError[] = []
    const stepIds = new Set<string>()
    
    for (const step of steps) {
      // ステップID重複チェック
      if (stepIds.has(step.id)) {
        errors.push({
          type: 'invalid_format',
          message: `Duplicate step id: ${step.id}`,
          stepId: step.id
        })
      }
      stepIds.add(step.id)
      
      // 必須フィールド
      if (!step.id || step.id.trim() === '') {
        errors.push({
          type: 'missing_field',
          message: 'Step id is required'
        })
      }
      
      if (!step.description || step.description.trim() === '') {
        errors.push({
          type: 'missing_field',
          message: 'Step description is required',
          stepId: step.id
        })
      }
    }
    
    // 依存関係の存在チェック
    for (const step of steps) {
      for (const dep of step.outputs) {
        // 出力変数名が有効か確認（簡易チェック）
        if (!dep || dep.trim() === '') {
          errors.push({
            type: 'invalid_format',
            message: 'Output variable name cannot be empty',
            stepId: step.id
          })
        }
      }
    }
    
    return errors
  }

  /**
   * 循環依存を検出
   */
  private hasCyclicDependencies(steps: BlueprintStep[]): boolean {
    const graph = new Map<string, Set<string>>()
    
    // グラフ構築
    for (const step of steps) {
      graph.set(step.id, new Set(step.outputs))
    }
    
    const visited = new Set<string>()
    const recStack = new Set<string>()
    
    function hasCycle(stepId: string): boolean {
      visited.add(stepId)
      recStack.add(stepId)
      
      const deps = graph.get(stepId)
      if (deps) {
        for (const dep of deps) {
          if (!visited.has(dep)) {
            if (hasCycle(dep)) {
              return true
            }
          } else if (recStack.has(dep)) {
            return true
          }
        }
      }
      
      recStack.delete(stepId)
      return false
    }
    
    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) {
          return true
        }
      }
    }
    
    return false
  }
}

/**
 * ヘルパー: Blueprintを検証
 * 
 * @param blueprint - Blueprint定義
 * @returns 検証結果
 */
export function validateBlueprint(blueprint: Blueprint): ValidationResult {
  const validator = new BlueprintValidator()
  return validator.validate(blueprint)
}

/**
 * ヘルパー: Blueprintが有効か確認
 * 
 * @param blueprint - Blueprint定義
 * @returns 有効な場合true
 */
export function isValidBlueprint(blueprint: Blueprint): boolean {
  const result = validateBlueprint(blueprint)
  return result.valid
}

