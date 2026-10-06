import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { Box, Button, Chip, Divider, IconButton, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import { Fragment } from 'react'
import { MAX_DEPTH } from '../fields'
import type { ConditionNode, GroupNode, Operator, QueryNode } from '../queryTree'
import ConditionRow from './ConditionRow'

export interface GroupActions {
  patchCondition: (id: string, patch: Partial<ConditionNode>) => void
  setOperator: (id: string, op: Operator) => void
  addCondition: (groupId: string) => void
  addGroup: (groupId: string) => void
  remove: (id: string) => void
  canAddCondition: boolean
}

interface Props {
  group: GroupNode
  depth: number
  actions: GroupActions
}

export default function GroupEditor({ group, depth, actions }: Props) {
  const isRoot = depth === 0
  const colour = group.op === 'AND' ? 'primary.main' : 'secondary.main'

  const renderChild = (child: QueryNode) =>
    child.kind === 'condition' ? (
      <ConditionRow
        condition={child}
        onChange={(patch) => actions.patchCondition(child.id, patch)}
        onRemove={() => actions.remove(child.id)}
        canRemove={!(isRoot && group.children.length === 1)}
      />
    ) : (
      <GroupEditor group={child} depth={depth + 1} actions={actions} />
    )

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderLeft: 4,
        borderLeftColor: colour,
        borderRadius: 1,
        p: 1.5,
        bgcolor: isRoot ? 'transparent' : 'action.hover',
      }}
    >
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ mb: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2">{isRoot ? 'Match' : 'Within this group, match'}</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          color={group.op === 'AND' ? 'primary' : 'secondary'}
          value={group.op}
          onChange={(_, op: Operator | null) => op && actions.setOperator(group.id, op)}
          aria-label="Combine with"
        >
          <ToggleButton value="AND">All (AND)</ToggleButton>
          <ToggleButton value="OR">Any (OR)</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">
          of the following
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {!isRoot && (
          <Tooltip title="Remove group">
            <IconButton size="small" aria-label="Remove group" onClick={() => actions.remove(group.id)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Stack spacing={1}>
        {group.children.map((child, i) => (
          <Fragment key={child.id}>
            {i > 0 && (
              <Divider textAlign="left" sx={{ '&::before': { width: '1.5%' } }}>
                <Chip size="small" label={group.op} color={group.op === 'AND' ? 'primary' : 'secondary'} variant="outlined" />
              </Divider>
            )}
            {renderChild(child)}
          </Fragment>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => actions.addCondition(group.id)} disabled={!actions.canAddCondition}>
          Condition
        </Button>
        <Button size="small" startIcon={<PlaylistAddIcon />} onClick={() => actions.addGroup(group.id)} disabled={depth >= MAX_DEPTH || !actions.canAddCondition}>
          Group
        </Button>
      </Stack>
    </Box>
  )
}
