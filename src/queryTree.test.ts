import { describe, expect, it } from 'vitest'
import { analyse, newCondition, newGroup, updateTree } from './queryTree'
import { validateValue } from './validators'

const ORCID = '0000-0002-1825-0097'

describe('analyse / serialize', () => {
  it('serialises a single condition', () => {
    const root = newGroup('AND', [newCondition('doi', '10.1038/nature12373')])
    expect(analyse(root)).toMatchObject({ filter: 'doi:10.1038/nature12373', hasErrors: false, used: 1 })
  })

  it('ignores blank conditions', () => {
    const root = newGroup('AND', [newCondition('doi', ''), newCondition('wiki', '  ')])
    expect(analyse(root)).toMatchObject({ filter: '', used: 0, total: 2, hasErrors: false })
  })

  it('joins with the group operator and parenthesises nested groups', () => {
    const root = newGroup('AND', [
      newCondition('wiki', 'enwiki'),
      newGroup('OR', [newCondition('openaccess', 'true'), newCondition('orcid', ORCID)]),
    ])
    expect(analyse(root).filter).toBe(`wiki:enwiki AND (openaccess:true OR orcid:${ORCID})`)
  })

  it('collapses groups with a single filled-in child', () => {
    const root = newGroup('OR', [newCondition('wiki', 'enwiki'), newGroup('AND', [newCondition('doi', ''), newCondition('wiki', 'dewiki')])])
    expect(analyse(root).filter).toBe('wiki:enwiki OR wiki:dewiki')
  })

  it('quotes values containing parentheses or spaces', () => {
    const root = newGroup('AND', [newCondition('doi', '10.1016/S0022-2836(05)80360-2')])
    expect(analyse(root).filter).toBe('doi:"10.1016/S0022-2836(05)80360-2"')
  })

  it('flags invalid values', () => {
    const root = newGroup('AND', [newCondition('orcid', '0000-0002-1825-0098')])
    expect(analyse(root).hasErrors).toBe(true)
  })
})

describe('updateTree', () => {
  it('patches and removes nodes immutably', () => {
    const a = newCondition('doi', 'x')
    const b = newCondition('wiki', 'enwiki')
    const root = newGroup('AND', [a, b])
    const patched = updateTree(root, a.id, (n) => (n.kind === 'condition' ? { ...n, value: 'y' } : n))
    expect(patched.children[0]).toMatchObject({ value: 'y' })
    expect(a.value).toBe('x')
    expect(updateTree(root, b.id, () => null).children).toHaveLength(1)
  })

  it('never removes the root', () => {
    const root = newGroup('AND')
    expect(updateTree(root, root.id, () => null)).toBe(root)
  })
})

describe('validateValue', () => {
  it.each([
    ['doi', '10.1038/nature12373', null],
    ['doi', 'https://doi.org/10.1038/nature12373', null],
    ['doi', 'nope', 'Expected a DOI'],
    ['orcid', ORCID, null],
    ['orcid', '0000-0002-9079-593X', null],
    ['orcid', '0000-0002-1825-0098', 'Checksum'],
    ['orcid', '1234', 'Expected'],
    ['openalex', 'W2741809807', null],
    ['openalex', 'https://openalex.org/A5023888391', null],
    ['openalex', 'T10001', 'Expected'],
    ['openaccess', 'true', null],
    ['openaccess', 'maybe', 'Choose'],
    ['wiki', 'enwiki', null],
    ['wiki', 'en wiki', 'Expected'],
    ['added_after', '2026-01-31', null],
    ['added_after', '2026-02-30', 'does not exist'],
    ['removed_before', '31/01/2026', 'Expected'],
  ] as const)('%s %s', (field, value, expected) => {
    const result = validateValue(field, value)
    if (expected === null) expect(result).toBeNull()
    else expect(result).toContain(expected)
  })

  it('rejects double quotes', () => {
    expect(validateValue('doi', '10.1000/a"b')).toContain('quotes')
  })
})
