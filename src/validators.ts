import type { FieldName } from './types'

// Client-side mirror of the validators in filter_api.py. They give instant
// feedback; the server remains the authority and re-validates everything.
const DOI_RE = /^10\.\d{4,9}\/\S+$/
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/
const OPENALEX_RE = /^[WAI]\d+$/
const WIKI_RE = /^[a-z][a-z0-9_]{1,63}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** ISO 7064 MOD 11-2 check digit, as used by ORCID. */
function orcidChecksumOk(orcid: string): boolean {
  const digits = orcid.replace(/-/g, '')
  let total = 0
  for (const ch of digits.slice(0, -1)) total = (total + Number(ch)) * 2
  const result = (12 - (total % 11)) % 11
  return digits.slice(-1) === (result === 10 ? 'X' : String(result))
}

function isRealDate(value: string): boolean {
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** Returns an error message, or null when the value is acceptable. */
export function validateValue(field: FieldName, raw: string): string | null {
  const v = raw.trim()
  if (v.includes('"')) return 'Double quotes are not supported in values'

  switch (field) {
    case 'doi': {
      const doi = v.replace(/^(https?:\/\/(dx\.)?doi\.org\/|doi:)/i, '')
      return DOI_RE.test(doi) ? null : 'Expected a DOI such as 10.1038/nature12373'
    }
    case 'orcid': {
      const orcid = v.replace(/^https?:\/\/orcid\.org\//i, '').toUpperCase()
      if (!ORCID_RE.test(orcid)) return 'Expected the form 0000-0000-0000-000X'
      return orcidChecksumOk(orcid) ? null : 'Checksum digit does not match; check for a typo'
    }
    case 'openalex': {
      const id = v.replace(/^https?:\/\/openalex\.org\//i, '').toUpperCase()
      return OPENALEX_RE.test(id) ? null : 'Expected W (work), A (author) or I (institution) followed by digits'
    }
    case 'openaccess':
      return v === 'true' || v === 'false' ? null : 'Choose open or closed'
    case 'wiki':
      return WIKI_RE.test(v.toLowerCase()) ? null : 'Expected a wiki database name such as enwiki'
    case 'added_after':
    case 'added_before':
    case 'removed_after':
    case 'removed_before':
      if (!DATE_RE.test(v)) return 'Expected a date (YYYY-MM-DD)'
      return isRealDate(v) ? null : 'That date does not exist'
  }
}
