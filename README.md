# Campus FindIt

A local-first campus lost-and-found prototype. It uses browser-native JavaScript and IndexedDB, with no hosted backend, paid API, or authentication provider. The campus layout and landmarks are illustrative and are not a real institution's map.

## Run it

Requires Node.js 18 or newer.

```powershell
npm run dev
```

Open <http://localhost:4173>. No package installation is needed because the app and its development server use Node's built-in modules and browser APIs only.

```powershell
npm test
npm run build
```

The static build is written to `dist/` and can be served from any static file server.

## What works

- Home dashboard with live counts, recent public reports, and rule-based possible matches.
- Lost and found report forms with validation, optional image upload (JPG/PNG/WebP, 3 MB limit), and a shared landmark directory.
- Item search and filters using public report fields.
- Four campus-map views: item markers, calculated hotspots, frequently reported locations, and a landmark explorer. The SVG map can be zoomed and reset; the adjacent landmark directory provides a text selection alternative.
- Central classification rules for standard, valuable/sensitive, and identity-bearing items.
- Private ownership claims, staff review, official custody, three-step handover checklist, and confirmed recovery.
- My Activity, local notifications, audit history, duplicate suggestions, weekly/monthly trends, recovery timing, location/category analytics, and versioned JSON export/import.
- Student/staff role switcher for demonstrating review actions.

## Storage and privacy boundaries

Reports, claims, custody records, notifications, and audit events are stored in versioned IndexedDB object stores. Uploaded image data is stored with its report. Records persist in the same browser profile after refresh and restart. There are no seeded item reports, claims, or recovery statistics. Landmarks and categories are configuration only.

Data does not synchronize between students or devices. The role switcher and client-side privacy filters demonstrate intended workflow only; anyone with access to the browser profile can inspect local database data. This prototype does not provide real authentication, secure authorization, or verified identity checks. Avoid storing passwords, payment details, access codes, or unredacted identity document photos.

## Demo walkthrough

1. As the student role, create a lost report and a found report. The found report waits for review.
2. Switch to the staff role from the lower sidebar and approve the found report.
3. Return to Find Items, open the found report, and submit a claim as the student role.
4. Switch to staff and review the claim; approve it for an in-person check.
5. In Recovery Centre, accept the item into custody. Check all three handover items and complete handover.
6. Review My Activity, notifications, map markers, and Insights & Trends. Refresh; the records remain in the same browser profile.

Claims are shown only for approved found reports. Staff approval for in-person verification does not itself mark an item recovered. The report becomes recovered only after staff completes all handover checklist fields.

## Checks

`npm test` runs Node's built-in test runner against privacy classification, public projections, matching, duplicate detection, analytics, and repository persistence/export behavior. The repository falls back to in-memory storage only in environments without IndexedDB (such as the Node unit test process); the browser uses IndexedDB.
