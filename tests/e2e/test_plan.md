# WatchPath AI E2E Test Plan

## SEARCH
### Happy Path
- SEARCH-HP-001 — Submit valid search query and navigate to results
- SEARCH-HP-002 — Change country and submit search query
- SEARCH-HP-003 — Navigate back to home page from search results
- SEARCH-HP-004 — Click on a search result to view title detail
### Negative / Validation
- SEARCH-NEG-001 — Submit empty search query
### Security
- SEARCH-SEC-001 — XSS payload in search query
- SEARCH-SEC-002 — SQLi payload in search query

## TITLE_DETAIL
### Happy Path
- TITLE-HP-001 — Load valid title detail page
- TITLE-HP-002 — Navigate back from title detail page
- TITLE-HP-003 — Verify free trial badge is displayed when available
### Negative / Validation
- TITLE-NEG-001 — Invalid title ID returns 404/safe error
### API
- TITLE-API-001 — Invalid API query returns standard error
- TITLE-API-002 — 500 error from API handled gracefully

## NAVIGATION
- NAV-HP-001 — Ensure 404 page for unknown routes
