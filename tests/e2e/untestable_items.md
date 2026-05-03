# Untestable Items

- External TMDB actual integration was not fully tested in E2E as it relies on live keys (mocked gracefully in backend).
- Selectors use standard DOM properties where available, some use generic locators due to Next.js lack of explicit test-ids.
