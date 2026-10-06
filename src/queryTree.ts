import { MAX_TERMS } from './fields'
import type { FieldName } from './types'
import { validateValue } from './validators'

export type Operator = 'AND' | 'OR'

export interface ConditionNode {
  kind: 'condition'
  id: string
  field: FieldName
  value: string
}

export interface GroupNode {
  kind: 'group'
  id: string
  op: Operator
  children: QueryNode[]
}

export type QueryNode = ConditionNode | GroupNode

let counter = 0
const uid = () => `n${++counter}`

export const newCondition = (field: FieldName = 'doi', value = ''): ConditionNode => ({
  kind: 'condition',
  id: uid(),
  field,
  value,
})

export const newGroup = (op: Operator = 'AND', children: QueryNode[] = [newCondition()]): GroupNode => ({
  kind: 'group',
  id: uid(),
  op,
  children,
})

function transform(node: QueryNode, id: string, fn: (n: QueryNode) => QueryNode | null): QueryNode | null {
  if (node.id === id) return fn(node)
  if (node.kind === 'condition') return node
  return {
    ...node,
    children: node.children.map((c) => transform(c, id, fn)).filter((c): c is QueryNode => c !== null),
  }
}

/** Immutably replace (or, when fn returns null, remove) the node with the given id. */
export function updateTree(root: GroupNode, id: string, fn: (n: QueryNode) => QueryNode | null): GroupNode {
  const result = transform(root, id, fn)
  return result !== null && result.kind === 'group' ? result : root
}

export function countConditions(node: QueryNode): number {
  return node.kind === 'condition' ? 1 : node.children.reduce((n, c) => n + countConditions(c), 0)
}

const isBlank = (c: ConditionNode) => c.value.trim() === ''

/** Blank conditions are ignored, so they are never an error. */
export const conditionError = (c: ConditionNode): string | null =>
  isBlank(c) ? null : validateValue(c.field, c.value)

// Values containing whitespace or parentheses must be quoted for the server's tokeniser.
const quote = (v: string) => (/[\s()]/.test(v) ? `"${v}"` : v)

function serialize(node: QueryNode, isRoot: boolean): string {
  if (node.kind === 'condition') return isBlank(node) ? '' : `${node.field}:${quote(node.value.trim())}`
  const parts = node.children.map((c) => serialize(c, false)).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  const joined = parts.join(` ${node.op} `)
  return isRoot ? joined : `(${joined})`
}

export interface Analysis {
  /** The filter string for the API ('' when nothing has been filled in). */
  filter: string
  /** True when at least one filled-in condition is invalid; submission is blocked. */
  hasErrors: boolean
  /** Number of filled-in conditions. */
  used: number
  /** Number of conditions, blank or not, for the server's term limit. */
  total: number
}

export function analyse(root: GroupNode): Analysis {
  let hasErrors = false
  let used = 0
  const walk = (n: QueryNode) => {
    if (n.kind === 'group') return n.children.forEach(walk)
    if (!isBlank(n)) {
      used++
      if (conditionError(n)) hasErrors = true
    }
  }
  walk(root)
  return { filter: serialize(root, true), hasErrors, used, total: countConditions(root) }
}

export const termLimitReached = (a: Analysis) => a.total >= MAX_TERMS
