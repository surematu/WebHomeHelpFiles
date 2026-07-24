# WebHomeHelpFiles

## Automation blueprint versioning rule

When editing files in `blueprints/automation`:

- `2026.7` (or `2026.07`) under represent current month and year. Replace with current date details.
- If the automation is not already on `2026.7.x` / `2026.07.x`, set `Blueprint versjon` to `2026.07.00`.
- If it is already on `2026.7.x` (or `2026.07.x`), increase `x` by `1`.

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

## README structure for automation documentation

Each automation has its own README file with a deep description. The summary under "Formål" on the individual README is also used as the summary on this main README page.

Required structure for each automation README:

```
1. Formål – Short overview of what the automation does (this summary also goes on the main README)
2. Eksempler på bruk og problemstillinger dette løser – Practical examples and use cases
3. FAQ – Common questions from non-technical users
4. Hva slags info trengs – What inputs the automation needs (high-level, non-technical)
5. Innstillinger – Table of all settings with defaults and explanations
6. Funksjonsbeskrivelse – Detailed but readable description of what it does with incoming data
7. Resultat – What entities are written to and what is the end result
8. Varsling – Customer-facing notifications (only default-active ones, with examples)
9. Annet – Other relevant info for the customer/user (9.1, 9.2 etc.)
10. Avansert – Advanced section for programming/AI use
    10.1 Forutsettninger – Prerequisites: required entities, integrations, helper YAML examples
    10.2 Relevante automasjoner og script – Links to related automations/scripts and why
    10.3 Beregnede verdier og variabler – Explanation of calculated values, variables, concepts
    10.4 Feilhåndtering – How errors are handled and what typical errors are handled
    10.5 Varsling og debug info – Debug notifications and settings useful for troubleshooting
11. Dokumentasjon – Links to relevant documentation
```

Guidelines:
- Sections 1–9 should be written for users with limited technical knowledge
- Section 10 (Avansert) is for technical users, developers, and AI
- Section 8 (Varsling) should only describe notifications that are active by default
- The "Formål" summary should match what is shown on this main README page
- Number sections with whole numbers (1, 2, 3...), subsections with decimals (9.1, 10.1...)

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
