import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material'

export default function FilterPreview({ filter }: { filter: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          Filter string
        </Typography>
        <Typography
          component="code"
          sx={{ display: 'block', fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all', color: filter ? 'text.primary' : 'text.disabled' }}
        >
          {filter || 'Fill in at least one condition'}
        </Typography>
      </Box>
      <Tooltip title="Copy">
        <span>
          <IconButton aria-label="Copy filter string" disabled={!filter} onClick={() => void navigator.clipboard.writeText(filter)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  )
}
