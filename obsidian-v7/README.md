# Revision 7.4 — final Settings polish

Removed the visible Correction history section from Settings and added the footer “Created by Aria and Buddy”. Audit records and JSON backups remain unchanged. Run `py preview.py` and open http://127.0.0.1:8765/. To update the existing preview, load online, close the old tabs/windows and reopen; do not clear site data.

# Revision 7.3 — animated controls

Run `py preview.py`, then open http://127.0.0.1:8765/. Settings → Screen transitions → On enables animations even if the system requests reduced motion. Transaction type, category, activity filters and settings selections now use compact in-app dropdowns with visible motion, retaining native select values for form submission. Settings sections animate on opening and closing. The Hide/Reveal control animates the newly rendered content; private values are removed immediately, never retained during a fade-out. System and Off retain their earlier behavior. No financial-engine or storage-format changes.

If updating at the same port, stop the old preview server, start the new one, load online, then close all old app tabs/windows and reopen so the new service worker can activate. Do not clear site data. Back up before any migration. Physical iPhone testing remains outstanding.

# Revision 7.2 — interaction motion

Run `py preview.py --port 8773` for an isolated review. Settings → Screen transitions → On enables page transitions, transaction sheet and dialog entrances/exits, and feedback on entry type, category and account selections even when the OS requests reduced motion. System follows the device; Off disables these interaction animations. Native select popups are controlled by the operating system, not the app. The previous financial engine, entry layout and storage schema are unchanged. For an in-place update at the previous port, load online, close all review tabs/windows and reopen to activate the updated worker; do not clear site data.

# Revision 7 — motion fix 1

Same personal English/Shamsi app and financial engine as Revision 7. Navigation now uses a visible 440 ms slide/fade. Settings → Screen transitions can follow the device, explicitly enable motion, or disable it. This setting is local UI state only. For fresh review, run `py preview.py --port 8772`. The app still uses the isolated review database; export a backup before migrating from the original production app. To update an existing review origin, close every old app tab/window after loading online, then reopen to activate the new worker. Never clear site storage.

# Revision 7 — faster entry and atmospheric design

Run `py preview.py --port 8770` and open http://127.0.0.1:8770/ for a fresh isolated review. Choose **Try fictional balances** or restore a private test backup. Tap Add, enter the amount, select the account and category, optionally add a note, and tap **Save transaction** once. The original validation and revision-checked storage remain in place; there is no intermediate review screen. Editing existing entries uses the same form. Notes and Jalali date are visible without expanding a section.

The Overview ring shows today’s Jalali day and abbreviated-in-design English month name (full transliterated name), independently of the month selected for reporting. Its colored arcs continue to represent account balance allocation, not spending. Privacy hides those arcs but leaves the date visible. Insights starts with the largest spending category and its percentage ring, followed by category bars, daily average, month comparison, account allocation and existing detailed reports. All tabs now have a 230 ms fade/slide, disabled by reduced-motion preference. The warmer, textured canvas is rendered locally without new assets or services.

For an in-place upgrade of the review build only, preserve the old port and browser data; follow the worker activation instructions below. The new preview port has separate storage. No live deployment or production changes were made. Screenshots use fictional data and a fixed test date of 07 Azar 1405. Current iPhone behavior still needs device testing.

Everything below is historical documentation and retained device/deployment guidance. Use the single Save transaction button instead of any earlier Review/Confirm steps.

# Revision 6 — compact entry and dedicated insights

Run `py preview.py --port 8769` and visit http://127.0.0.1:8769/ for a fresh isolated review. Both transaction type and expense category use native dropdowns. New transfers use ordinary Transfer; historical Shahrdari Fill records remain valid and appear as transfers in Activity. Insights now contains daily average, matching-day month comparison, categories, highest-spending days and debt details. Overview no longer duplicates those reports. Privacy hides the financial analysis.

The rest of this document includes earlier review and deployment instructions; earlier descriptions of the category chips and six entry choices are historical.

# Revision 5 — familiar transaction form

Run `py preview.py --port 8768` and visit http://127.0.0.1:8768/ for a fresh isolated review. Choose fictional balances or restore a private backup only if desired. The new dropdown has all six transaction types; categories can be swiped or browsed with arrows. All previous chart and wallet changes remain.

# Pocket Ledger 2.0 · Obsidian Edition
## Open the review build — daily spending & native keyboard revision 4
Extract the archive. The complete static application is in **app/**. It has no build step, npm install, sign-in, remote fonts or paid services. The JavaScript, CSS and unmodified font files are the editable sources. The development snapshots are identified in QA.md.

With Python 3 installed, run this command in the extracted folder. On Windows, use `py` in place of `python3`.

    python3 preview.py

Open http://127.0.0.1:8765/ on that computer. Choose **Try fictional balances**. This creates fictional opening amounts on first use, with no fabricated transactions. Tap **+**, choose **Blu**, enter **50** in the default thousands-of-toman mode, then tap **Review → Confirm**. Net should move from 24,850,000 to 24,800,000. The full-toman mode instead takes 50000. Use Settings to change the input convention. Tap the eye beside the app name to hide amounts, chart geometry and financial detail. Tap it again to reveal them. Use the scrollable Jalali month chips to change months and Daily / Cumulative to switch between daily expenses and running totals. Tap the amount field to open the device keyboard.

If upgrading the previous review build, use the same review-only origin and browser to keep its ledger. Stop the old preview server and start this one. Load the new version once online, close all review tabs/windows, and reopen to activate the updated service worker. Do not clear browser site data. For a fresh review without any old cache, run `py preview.py --port 8767` and open http://127.0.0.1:8767/ (separate test storage).

## Try it on an iPhone
1. Join the same trusted Wi-Fi network as the computer. For a private visual and transaction-entry trial, run `python3 preview.py --bind 0.0.0.0`. On Windows, find the Wi-Fi IPv4 address using `ipconfig`. Open `http://<computer-LAN-IP>:8765/` in iPhone Safari. The server exposes only the static app folder. Use fictional balances. Stop the server with Ctrl+C when finished.
2. For an **offline / installed PWA trial**, use a dedicated HTTPS test origin trusted by the iPhone. If you already have a certificate for a local hostname, run `python3 preview.py --bind 0.0.0.0 --cert /path/to/cert.pem --key /path/to/key.pem` and open that matching HTTPS hostname and port in Safari. Keep the key outside the app directory. Plain HTTP over Wi-Fi is sufficient for layout review but does not enable service-worker installation. Desktop localhost is a separate secure-context exception.
3. From Safari’s Share menu choose **Add to Home Screen**. Enable **Open as Web App** if offered. Launch the home-screen app while connected and use its own fictional fixture. Close and reopen it online once. Enable Airplane Mode, reopen and record another fictional expense. Close and reopen again and compare the balance. Check the native numerical keyboard, scroll the wallet, and try the sheet in landscape and with larger system text. Confirm the bottom action remains reachable. iOS storage may differ between Safari and the installed app.
4. Use Settings → Download JSON backup. Store that file privately. CSV is a transaction report. JSON is the full backup, including corrections, opening values, recipient preferences and card details if supplied. Restore through Settings or the opening screen, read the confirmation, and compare date, counts and balances.

## Later production replacement and rollback
The included app always opens **pocket-ledger-obsidian-review-v1**. Its worker cache name includes the review namespace and full registration scope. Run review on a separate origin from production. Hosting the review files directly at the production path could replace the live worker registration even though the database name differs.

After visual approval and successful device tests, schedule the switch at a time when all devices/tabs can stop entering records. For each independent production ledger, export a dated JSON backup from the original app and retain a second private copy. Record the selected month, balances per account, debt, row and audit counts. Verify the backup on a separate disposable origin, then discard only that isolated test copy. Preserve the exact original app files and service worker as a rollback release.

Prepare a **separate production build** using the original database name, version, store and key. Keep the existing HTTPS origin, path, manifest identity and worker scope. Keep the same production device and browser installation. Use a new release-specific app-shell cache; cache all locally bundled assets successfully before activation. Test that release and its rollback against copies on a staging origin. Compare values after a cold start and after an offline restart. Do not import the backup into the live ledger just because the app shell changed.

Only after explicit deployment approval, close all app instances, deploy the verified files together, then reopen one instance. Confirm its worker version, openings, rows, monthly totals, account balances and debt before entering new records. An unexpected setup screen means stop and inspect origin, app identity and database selection. Entering new opening values there could create an unrelated ledger.

If checks fail, pause entries. Export the current state separately if any entries were made after the switch. Restore the pinned original shell and worker; reopen at the original origin and verify the saved reference values. Preserve the database and browser site data throughout. Restore a verified backup only after safeguarding newer changes and explicitly approving replacement of the ledger. A backup from before the switch omits later entries.
