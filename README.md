# WebHomeHelpFiles

## Automation blueprint versioning rule

When editing files in `blueprints/automation`:

- `year.month.version` represent current month and year. Replace with current date details. (Example `2026.08`)
- If version is not already on current month, set version to `00`. (Example adjust from `2026.07.32` to `2026.08.00`)
- If version is on current month increase by 1. (Example if before `2026.08.00`, increase to `2026.08.01`)

---

## Coding convention – step-by-step with named variables

When writing or updating automation action sequences, break the logic into **many small, well-named steps** — one step per meaningful unit of work — and store all intermediate results in **named variables**.

Rules:
- Each template variable should compute **one specific thing** (e.g. build a raw list, clean a list, deduplicate, build the final message). Do not combine multiple unrelated computations into a single variable.
- Give variables descriptive names that reflect what they contain (e.g. `slow_list_raw`, `slow_list_clean`, `low_list_percent_clean`).
- Use separate `variables:` steps rather than merging everything into one large template block.
- This makes every intermediate value visible in the Home Assistant **trace viewer**, which is essential for troubleshooting.

Example pattern (used consistently in `varsel_enhet.yaml`):
```
Steg X-A  →  raw list (collect + deduplicate into a map)
Steg X-B  →  cleaned list (filter meaningless entries, render lines)
Steg X-C  →  dedup against other lists
Steg X-D  →  final clean pass
Steg X+1  →  build notification title (separate variable)
Steg X+1  →  build notification message body (separate variable)
Steg X+2  →  send notification
```

---

## README check when changing automations

When an automation blueprint is adjusted, check whether its related README/documentation still matches and update it when needed.

---

## README structure for notifications

Each automation has a section for "Varsling". It should be collapsed by default.

"Varsling (Valgfri)" section should include:
1. Title: **Pushover destination (valgfri)**
Description: Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres slik at den blir sendt ulikt.
2. Title: **Pushover priority**
Description: −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd), 1 (Høy prioritet, rødt varsel, omgår stilleperiode), 2 (nødvarsel som gjentas til det bekreftes).
3. Title: **Levetid varsel (timer)**
Description: Hvor lenge skal varslet være synlig før det forsvinner?
Extra info, for documentation, only visible here in readme: The value in the pushover packet is in seconds, so it needs to be recalculated from hours to secounds in the automation.
4. **Other** - Other relevant notification settings can be added here, such as; Send notification upon change or simelar relevant for that automation, acording to the documentation for each induidual notification.
5. Title: **Send varsel ved manuell kjøring**
Description: Sett til true for å sende varsel når automasjonen kjøres manuelt. Sett til false for å ikke sende varsel ved manuell kjøring.

---

## README structure for automation documentation

Each automation has its own README file with a deep description. The summary under "Formål" on the individual README is also used as the summary on this main README page.

Required structure for each automation README:

```
── BRUKERVENLIG (§1–9) ──────────────────────────────────────────────────────
1.  Formål              – Short overview (this summary also goes on the main README)
2.  Eksempler på bruk   – Practical examples and use cases
3.  FAQ                 – Common questions from non-technical users
4.  Hva slags info trengs – What inputs the automation needs (high-level)
5.  Innstillinger       – Table of all settings with defaults and explanations
6.  Funksjonsbeskrivelse – Detailed but readable description of what it does
7.  Resultat            – What entities are written to and what the end result is
8.  Varsling            – User-facing notifications active by default (title + message examples)
9.  Annet               – Other relevant info for the user

── AVANSERT / TEKNISK (§10–11) ──────────────────────────────────────────────
10. Avansert            – For technical users, developers, and AI
    10.1 Forutsettninger         – Required entities, integrations, automations, scripts
    10.2 Eksempler         – Relevant YAML examples
    10.3 Relevante automasjoner og script – Links to related automations/scripts and why
    10.4 Beregnede verdier og variabler  – Calculated values, variables, key concepts
    10.5 Feilhåndtering                  – How errors are handled; typical error scenarios
    10.6 Varsling og debug info          – Debug notifications (off by default) + troubleshooting settings
    (10.7, 10.8 … add as needed)
11. Dokumentasjon       – Links to relevant documentation
```

Guidelines:
- **Subsections apply to every section**: any section can be split into x.1, x.2 … when the content benefits from it (e.g. 2.1, 3.1, 5.1, 6.1, 9.1 …). This is not limited to FAQ.
- **Extra sections between 10 and 11**: additional advanced topics that don't fit 10.1–10.5 can be added as 10.6, 10.7 … (do not insert whole new top-level numbers between 10 and 11).
- Sections 1–9 are written for users with limited technical knowledge; section 10 is for technical users/AI.
- Section 8 (Varsling) describes only notifications that are **active by default**.
- Section 10.5 covers debug notifications (typically **disabled** by default) and troubleshooting settings.
- Subsections 10.1–10.6 are fixed and must always be present; 10.7+ are optional extensions.
- Very advanced or highly technical content that does not fit §1–9 should be moved into §10.
- The "Formål" summary (§1) should match the summary shown on this main README page.

---

## Automation blueprints

### driftsmodus_varme_kjoling_automatisk.yaml — Driftsmodus (automatisk valg varme/kjøling)

Velger automatisk driftsmodus **VINTER** eller **SOMMER** én gang daglig kl. 20:00, basert på gjennomsnittstemperatur siste 72 timer, prognosert maksimumstemperatur neste døgn, skydekning (soltillegg), og faste vinter-/sommerperioder som sikkerhetsregler. Sender Pushover-varsel ved modusendring eller vesentlig datamangel.

Detaljert funksjonsbeskrivelse:
- [README_automatisk_valg_varme_kjoling.md](./README_automatisk_valg_varme_kjoling.md)

---

### varsel_enhet.yaml — Varsel - Enhet (batteri + signal + uptime)

Samler overvåkning av batteridrevne enheter og Uptime Kuma-tjenester i én Pushover-varsling:

- **Planlagt/manuell sjekk (standard: onsdag 09:05):** Sender én samlet varsling med batterinivå, langsomt signal og full Uptime Kuma-status.
- **Rask sjekk (hver 4. time):** Sender varsling om nylig mistet batterisignal og Uptime Kuma-enheter som nettopp gikk offline.
- **Kritisk Uptime-sensor:** Utløser øyeblikkelig varsling ved statusendring.
- Hvis en enhet er nevnt i en tidligere liste i samme varsel, vises den ikke på nytt i senere lister.

Detaljert funksjonsbeskrivelse:
- [README_varsel_enhet.md](./README_varsel_enhet.md)

---


### effektgrense_automatisk.yaml — KWh-grense - Temperatur + månedsminimum

Justerer automatisk en kWh-grense (input_number) basert på forventet utetemperatur og et konfigurerbart månedsminimum. Grensen økes på kalde dager og begrenses av månedsminimumet – og skrives kun ned igjen første dag i måneden.

Detaljert funksjonsbeskrivelse:
- [README_effektgrense_automatisk.md](./README_effektgrense_automatisk.md)

---

### kalender_kalkulert_varmebehov.yaml — Kalender - Kalkulert varmebehov

Beregner automatisk når forvarming og normal varme skal aktiveres, basert på kalenderhendelser, nåværende innetemperatur og værvarsel. Sørger for at rommet er varmt nok til riktig tid.

Detaljert funksjonsbeskrivelse:
- [README_kalender_kalkulert_varmebehov.md](./README_kalender_kalkulert_varmebehov.md)

---

### temperature_sensor_alarm.yaml — Temperaturalarm

Sender Pushover-varsel hvis en temperatursensor:
- Går over terskel 1 i 15 minutter
- Går over terskel 2 i 60 minutter
- Går til ukjent tilstand i 15 minutter

Typisk bruk: overvåkning av frysere, kjølerom eller serverrom.

Detaljert funksjonsbeskrivelse:
- [README_temperature_sensor_alarm.md](./README_temperature_sensor_alarm.md)

---

### varmepumpe_regulering.yaml — Varmepumpe (Rom) Robot

Regulerer varmepumpe-settpunktet kontinuerlig basert på pådragssignalet fra romreguleringen (0–100 %). Høyere pådrag gir høyere varmesettpunkt (eller lavere kjølesettpunkt). Støtter:
- Valgfri panelovn som supplement ved høyt pådrag (aktiveres gradvis og kun etter at varmepumpen er rampet opp).
- Sesongbasert styring via `input_select.driftsmodus_vinter_sommer` (VINTER/SOMMER) med nødoverkobling ved ekstreme romtemperaturer.
- Valgfri vifteregulering basert på pådragsnivå.
- Debug-varsler via Pushover (av som standard).

Detaljert funksjonsbeskrivelse:
- [README_varmepumpe_regulering.md](./README_varmepumpe_regulering.md)

---

### pwm_output.yaml — PWM Output – Bryterstyring

Styrer en bryter (switch) med PWM (pulsbreddemodulasjon) basert på et inngangssignal 0–100 %. Høyere prosentandel gir lengre på-tid per syklus. En minimumsgrense for på/av-tid forhindrer at bryteren slår raskt av og på ved lave eller høye verdier. Offset-innstillingen gjør det mulig å forskyve syklusen slik at to PWM-er ved samme prosentandel ikke starter til nøyaktig samme tidspunkt.

Detaljert funksjonsbeskrivelse:
- [README_pwm_output.md](./README_pwm_output.md)

---

### varsel_printer.yaml — Varsel - Printer - Blekk/Toner lavt

Finner automatisk alle printer-sensorer og sender varsel via Pushover når blekk eller toner er lavere enn valgt terskel. Grupperer sensorer per printer og filtrerer ugyldige verdier automatisk.

Detaljert funksjonsbeskrivelse:
- [README_varsel_printer.md](./README_varsel_printer.md)

---

## Script blueprints

### varsel_pushover.yaml — Varsel - Pushover Send Melding

Felles script-blueprint for å sende standardiserte Pushover-varsler fra WebHome-automasjonene. Håndterer tittelformat, TTL-tekst og routing til ulike mottakergrupper.

Detaljert funksjonsbeskrivelse:
- [README_varsel_pushover.md](./README_varsel_pushover.md)

---
