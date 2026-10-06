export type FieldName =
  | 'doi'
  | 'orcid'
  | 'openalex'
  | 'openaccess'
  | 'wiki'
  | 'added_after'
  | 'added_before'
  | 'removed_after'
  | 'removed_before'

export interface UrlRef {
  type: string
  url: string
}

/** One row returned by GET /api/citations. Work columns are null for unresolved citations. */
export interface Citation {
  CitationId: number
  PageId: number
  PageTitle: string | null
  Wiki: string
  RevisionAdded: number
  AddedAt: string | null
  AddedBy: string | null
  RevisionRemoved: number | null
  RemovedAt: string | null
  RemovedBy: string | null
  WorkId: number | null
  Title: string | null
  PublicationDate: string | null
  Language: string | null
  OAStatus: string | null
  OA_Url: string | null
  DOI: string | null
  ISBN: string | null
  PMID: number | null
  PMCID: number | null
  ISSN: string | null
  URLs: UrlRef[]
}

export interface CitationsResponse {
  filter: string
  limit: number
  offset: number
  /** rows in this page */
  count: number
  /** all matches, ignoring paging */
  total: number
  citations: Citation[]
}

export interface ApiErrorDetail {
  pos?: number
  field?: string
  value?: string
  message: string
}
