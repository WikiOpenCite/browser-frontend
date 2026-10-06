import { useMemo } from 'react'
import type { Analysis, ConditionNode, GroupNode, Operator } from '../queryTree'
import { newCondition, newGroup, termLimitReached, updateTree } from '../queryTree'
import GroupEditor from './GroupEditor'
import type { GroupActions } from './GroupEditor'

interface Props {
  root: GroupNode
  onChange: (root: GroupNode) => void
  analysis: Analysis
}

export default function QueryBuilder({ root, onChange, analysis }: Props) {
  const actions = useMemo<GroupActions>(() => {
    const withGroup = (id: string, fn: (g: GroupNode) => GroupNode) =>
      onChange(updateTree(root, id, (n) => (n.kind === 'group' ? fn(n) : n)))

    return {
      canAddCondition: !termLimitReached(analysis),
      patchCondition: (id: string, patch: Partial<ConditionNode>) =>
        onChange(updateTree(root, id, (n) => (n.kind === 'condition' ? { ...n, ...patch } : n))),
      setOperator: (id: string, op: Operator) => withGroup(id, (g) => ({ ...g, op })),
      addCondition: (groupId: string) => withGroup(groupId, (g) => ({ ...g, children: [...g.children, newCondition()] })),
      addGroup: (groupId: string) => withGroup(groupId, (g) => ({ ...g, children: [...g.children, newGroup('OR')] })),
      remove: (id: string) => onChange(updateTree(root, id, () => null)),
    }
  }, [root, onChange, analysis])

  return <GroupEditor group={root} depth={0} actions={actions} />
}
