import FileDownloadIcon from "@mui/icons-material/FileDownload";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import { useState } from "react";
import { ApiError, csvUrl } from "../api";
import type { Citation, CitationsResponse } from "../types";

const COLUMNS = 7;
const PAGE_SIZES = [10, 25, 50, 100];

const OA_CHIPS: Record<string, { label: string; color: ChipProps["color"] }> = {
  OA_CATEGORY_DIAMOND: { label: "Diamond", color: "info" },
  OA_CATEGORY_GOLD: { label: "Gold", color: "warning" },
  OA_CATEGORY_GREEN: { label: "Green", color: "success" },
  OA_CATEGORY_HYBRID: { label: "Hybrid", color: "secondary" },
  OA_CATEGORY_BRONZE: { label: "Bronze", color: "default" },
  OA_CATEGORY_CLOSED: { label: "Closed", color: "error" },
  OA_CATEGORY_UNSPECIFIED: { label: "Unknown", color: "default" },
};

/** '2026-03-15T12:00:00' -> '2026-03-15 12:00' */
const formatDateTime = (s: string | null) => (s ? s.replace("T", " ").slice(0, 16) : "—");

/** Only http(s) URLs become links; anything else (e.g. javascript:) is shown as text. */
const safeHref = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined);

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const safe = safeHref(href);
  return safe ? (
    <Link href={safe} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: "break-all" }}>
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {children ?? "—"}
      </Typography>
    </>
  );
}

function CitationDetails({ c }: { c: Citation }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        columnGap: 3,
        rowGap: 0.5,
        p: 2,
      }}
    >
      <Detail label="Work">
        {c.WorkId !== null ? (
          <ExternalLink href={`https://openalex.org/W${c.WorkId}`}>{`W${c.WorkId}`}</ExternalLink>
        ) : null}
      </Detail>
      <Detail label="Published">{c.PublicationDate}</Detail>
      <Detail label="Language">{c.Language}</Detail>
      <Detail label="Open access URL">
        {c.OA_Url ? <ExternalLink href={c.OA_Url}>{c.OA_Url}</ExternalLink> : null}
      </Detail>
      <Detail label="ISBN / ISSN">{[c.ISBN, c.ISSN].filter(Boolean).join(" / ") || null}</Detail>
      <Detail label="PMID / PMCID">
        {[c.PMID, c.PMCID].filter((v) => v !== null).join(" / ") || null}
      </Detail>
      <Detail label="Page ID">{c.PageId}</Detail>
      <Detail label="Added">
        revision {c.RevisionAdded} · {formatDateTime(c.AddedAt)} · {c.AddedBy ?? "unknown"}
      </Detail>
      <Detail label="Removed">
        {c.RevisionRemoved !== null
          ? `revision ${c.RevisionRemoved} · ${formatDateTime(c.RemovedAt)} · ${c.RemovedBy ?? "unknown"}`
          : null}
      </Detail>
      <Detail label="Cited URLs">
        {c.URLs.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {c.URLs.map((u, i) => (
              <li key={i}>
                <ExternalLink href={u.url}>{u.url}</ExternalLink>{" "}
                <Chip
                  size="small"
                  variant="outlined"
                  label={u.type.replace("URL_TYPE_", "").toLowerCase()}
                />
              </li>
            ))}
          </Box>
        ) : null}
      </Detail>
    </Box>
  );
}

function CitationRow({ c }: { c: Citation }) {
  const [open, setOpen] = useState(false);
  const oa = c.OAStatus ? OA_CHIPS[c.OAStatus] : undefined;

  return (
    <>
      <TableRow hover sx={{ "& > td": { borderBottom: open ? "unset" : undefined } }}>
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            aria-label={open ? "Hide details" : "Show details"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{c.CitationId}</TableCell>
        <TableCell sx={{ maxWidth: 420 }}>
          {c.WorkId !== null ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {c.Title ?? <em>Untitled work</em>}
              </Typography>
              {c.DOI && (
                <Typography variant="caption">
                  <ExternalLink href={`https://doi.org/${encodeURI(c.DOI)}`}>{c.DOI}</ExternalLink>
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
              Unresolved work
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2">{c.PageTitle ?? "—"}</Typography>
          <Chip size="small" variant="outlined" label={c.Wiki} />
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Typography variant="body2">{formatDateTime(c.AddedAt)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {c.AddedBy}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {c.RevisionRemoved !== null ? (
            <>
              <Typography variant="body2">{formatDateTime(c.RemovedAt)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {c.RemovedBy}
              </Typography>
            </>
          ) : (
            <Chip size="small" color="success" variant="outlined" label="Current" />
          )}
        </TableCell>
        <TableCell>{oa ? <Chip size="small" label={oa.label} color={oa.color} /> : "—"}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={COLUMNS}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <CitationDetails c={c} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

interface Props {
  data: CitationsResponse | null;
  loading: boolean;
  error: Error | null;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

export default function ResultsTable({
  data,
  loading,
  error,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: Props) {
  if (error) {
    const details = error instanceof ApiError ? error.details : [];
    return (
      <Alert severity="error">
        <AlertTitle>{error.message}</AlertTitle>
        {details.length > 0 && (
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {details.map((d, i) => (
              <li key={i}>
                {d.field && <strong>{d.field}: </strong>}
                {d.message}
                {d.value !== undefined && <code> ({d.value})</code>}
              </li>
            ))}
          </Box>
        )}
      </Alert>
    );
  }

  if (!data) return loading ? <LinearProgress /> : null;

  return (
    <Paper variant="outlined">
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography variant="subtitle1">
          {data.total.toLocaleString()} {data.total === 1 ? "citation" : "citations"} found
        </Typography>
        {data.total > 0 && (
          <Tooltip
            title={`Download all ${data.total.toLocaleString()} matching citations, not just this page`}
          >
            <Button
              size="small"
              startIcon={<FileDownloadIcon />}
              component="a"
              href={csvUrl(data.filter)}
              download
            >
              Download CSV
            </Button>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ height: 4 }}>{loading && <LinearProgress />}</Box>

      {data.total === 0 ? (
        <Typography color="text.secondary" sx={{ p: 3 }}>
          No citations match this filter.
        </Typography>
      ) : (
        <>
          <TableContainer sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 150ms" }}>
            <Table size="small" aria-label="Citations">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>ID</TableCell>
                  <TableCell>Work</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Added (UTC)</TableCell>
                  <TableCell>Removed (UTC)</TableCell>
                  <TableCell>Open access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.citations.map((c) => (
                  <CitationRow key={c.CitationId} c={c} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={PAGE_SIZES}
            onPageChange={(_, p) => onPageChange(p)}
            onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          />
        </>
      )}
    </Paper>
  );
}
