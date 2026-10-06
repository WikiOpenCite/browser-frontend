import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material'
import { FIELDS, FIELD_BY_NAME, defaultValue } from '../fields'
import { conditionError } from '../queryTree'
import type { ConditionNode } from '../queryTree'
import type { FieldName } from '../types'

interface Props {
  condition: ConditionNode
  onChange: (patch: Partial<ConditionNode>) => void
  onRemove: () => void
  canRemove: boolean
}

export default function ConditionRow({ condition, onChange, onRemove, canRemove }: Props) {
  const def = FIELD_BY_NAME[condition.field]
  const error = conditionError(condition)

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'flex-start' } }}>
      <TextField
        select
        size="small"
        label="Field"
        value={condition.field}
        onChange={(e) => {
          const field = e.target.value as FieldName
          onChange({ field, value: defaultValue(field) })
        }}
        sx={{ minWidth: 200 }}
      >
        {FIELDS.map((f) => (
          <MenuItem key={f.name} value={f.name}>
            {f.label}
          </MenuItem>
        ))}
      </TextField>

      {def.input === 'boolean' ? (
        <TextField
          select
          size="small"
          label="Value"
          value={condition.value}
          onChange={(e) => onChange({ value: e.target.value })}
          helperText={def.help}
          sx={{ flex: 1, minWidth: 200 }}
        >
          <MenuItem value="true">Open access</MenuItem>
          <MenuItem value="false">Closed</MenuItem>
        </TextField>
      ) : (
        <TextField
          size="small"
          label="Value"
          type={def.input === 'date' ? 'date' : 'text'}
          value={condition.value}
          placeholder={def.placeholder}
          onChange={(e) => onChange({ value: e.target.value })}
          error={error !== null}
          helperText={error ?? def.help}
          slotProps={def.input === 'date' ? { inputLabel: { shrink: true } } : undefined}
          sx={{ flex: 1, minWidth: 200 }}
        />
      )}

      <Tooltip title="Remove condition">
        <span>
          <IconButton aria-label="Remove condition" onClick={onRemove} disabled={!canRemove}>
            <DeleteOutlineIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
