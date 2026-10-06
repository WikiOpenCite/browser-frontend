import SearchIcon from '@mui/icons-material/Search'
import { AppBar, Box, Button, Container, Paper, Stack, Toolbar, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import FilterPreview from './components/FilterPreview'
import QueryBuilder from './components/QueryBuilder'
import ResultsTable from './components/ResultsTable'
import { analyse, newGroup } from './queryTree'
import type { GroupNode } from './queryTree'
import { useCitations } from './useCitations'
import type { Search } from './useCitations'

const DEFAULT_PAGE_SIZE = 25

export default function App() {
  const [root, setRoot] = useState<GroupNode>(() => newGroup('AND'))
  const [search, setSearch] = useState<Search | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE)

  const analysis = useMemo(() => analyse(root), [root])
  const { loading, data, error } = useCitations(search, page, rowsPerPage)

  const canSubmit = analysis.used > 0 && !analysis.hasErrors

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setPage(0)
    setSearch((prev) => ({ filter: analysis.filter, nonce: (prev?.nonce ?? 0) + 1 }))
  }

  const handleReset = () => {
    setRoot(newGroup('AND'))
    setSearch(null)
    setPage(0)
  }

  return (
    <>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h6" component="h1">
            Citation Explorer
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Paper variant="outlined" component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Build a query
              </Typography>
              <QueryBuilder root={root} onChange={setRoot} analysis={analysis} />
              <FilterPreview filter={analysis.filter} />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button onClick={handleReset}>Reset</Button>
                <Button type="submit" variant="contained" startIcon={<SearchIcon />} disabled={!canSubmit}>
                  Search
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Blank conditions are ignored. Dates are UTC; “after” is inclusive and “before” is exclusive.
              </Typography>
            </Stack>
          </Paper>

          <ResultsTable
            data={data}
            loading={loading}
            error={error}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(n) => {
              setRowsPerPage(n)
              setPage(0)
            }}
          />
        </Stack>
      </Container>
    </>
  )
}
