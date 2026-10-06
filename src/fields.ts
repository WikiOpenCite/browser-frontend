import type { FieldName } from './types'

export type InputKind = 'text' | 'boolean' | 'date'

export interface FieldDef {
  name: FieldName
  label: string
  input: InputKind
  placeholder?: string
  help: string
}

// Keep in step with the limits in filter_api.py
export const MAX_TERMS = 25
export const MAX_DEPTH = 6

export const FIELDS: FieldDef[] = [
  { name: 'doi', label: 'DOI', input: 'text', placeholder: '10.1038/nature12373', help: 'Work DOI, with or without https://doi.org/' },
  { name: 'orcid', label: 'Author ORCID', input: 'text', placeholder: '0000-0002-1825-0097', help: 'An author of the work' },
  { name: 'openalex', label: 'OpenAlex ID', input: 'text', placeholder: 'W2741809807', help: 'W… work, A… author or I… institution' },
  { name: 'openaccess', label: 'Open access', input: 'boolean', help: 'Open means diamond, gold, green, hybrid or bronze' },
  { name: 'wiki', label: 'Wiki', input: 'text', placeholder: 'enwiki', help: 'Wiki database name, e.g. enwiki, dewiki' },
  { name: 'added_after', label: 'Added on or after', input: 'date', help: 'UTC, inclusive' },
  { name: 'added_before', label: 'Added before', input: 'date', help: 'UTC, exclusive' },
  { name: 'removed_after', label: 'Removed on or after', input: 'date', help: 'UTC, inclusive' },
  { name: 'removed_before', label: 'Removed before', input: 'date', help: 'UTC, exclusive' },
]

export const FIELD_BY_NAME = Object.fromEntries(FIELDS.map((f) => [f.name, f])) as Record<FieldName, FieldDef>

/** The value a condition starts with when its field is chosen. */
export const defaultValue = (field: FieldName): string => (FIELD_BY_NAME[field].input === 'boolean' ? 'true' : '')
