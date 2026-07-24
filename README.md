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

## Automation blueprints

### driftsmodus_varme_kjoling_automatisk.yaml — Driftsmodus (automatisk valg varme/kjøling)

Velger automatisk driftsmodus **VARME** eller **KJØLING** én gang daglig kl. 20:00, basert på:
- Gjennomsnittstemperatur siste 72 timer (med fallback til nåværende utetemperatur)
- Prognosert maksimumstemperatur neste døgn
- Prognosert skydekning kl. 10:00–18:00 (soltillegg)
- Faste vinter-/sommerperioder som sikkerhetsregler
- Pushover-varsel ved modusendring eller vesentlig datamangel uten endring

Detaljert funksjonsbeskrivelse:
- [README_automatisk_valg_varme_kjoling.md](./README_automatisk_valg_varme_kjoling.md)

---

### varsel_enhet.yaml — Varsel - Enhet (batteri + signal + uptime)

Samlet overvåkning av batteri-enheter og Uptime Kuma i én blueprint:

- **Time_pattern (hver 4. time):** Sender én samlet varsling med nylig mistet batterisignal + Uptime Kuma-enheter som nylig gikk offline.
- **Planlagt/manuell sjekk:** Sender én samlet varsling med batterinivå, langsomt signal og full Uptime Kuma-status.
- **Kritisk Uptime-sensor:** Kan utløse øyeblikkelig varsling ved statusendring.
- **Viktig regel for alle meldinger med flere seksjoner/lister:** Hvis en enhet er nevnt i en tidligere liste i samme varsel, skal den ikke listes på nytt i senere lister.

Detaljert funksjonsbeskrivelse:
- [README_varsel_enhet.md](./README_varsel_enhet.md)

---


### effektgrense_automatisk.yaml — KWh-grense - Temperatur + månedsminimum

Setter en `input_number` (kWh-grense) basert på værvarsel (snittemperatur neste N timer) kombinert med et konfigurerbart månedsminimum. Velger temperaturminimum fra terskelnivåer (veryCold/littleCold/warm) og bruker høyeste av temperaturminimum og månedsminimum.

Detaljert funksjonsbeskrivelse:
- [README_effektgrense_automatisk.md](./README_effektgrense_automatisk.md)

---

### kalender_kalkulert_varmebehov.yaml — Kalender - Kalkulert varmebehov

Beregner når forvarming og normal varme skal være aktiv basert på kalenderhendelser, innetemperatur og værvarsel (snittemperatur neste 24 timer). Aktiverer varme i god tid før hendelsen starter.

Detaljert funksjonsbeskrivelse:
- [README_kalender_kalkulert_varmebehov.md](./README_kalender_kalkulert_varmebehov.md)

---

### temperature_sensor_alarm.yaml — Temperature Sensor Alarm

Sender Pushover-varsel hvis en temperatursensor:
- Går over grense 1 i 15 minutter
- Går over grense 2 i 60 minutter
- Går til `unknown` i 15 minutter

Detaljert funksjonsbeskrivelse:
- [README_temperature_sensor_alarm.md](./README_temperature_sensor_alarm.md)

---

### varmepumpe_regulering.yaml — Varmepumpe (Rom) Robot

Regulerer varmepumpe-settpunkt lineært mellom to punkter basert på pådrag (%). Basissettpunkt er
det høyeste av rom-settpunkt og comfort-settpunkt. Støtter:
- Tre pådragskilder: `power_percent`, `regulated_target_temperature`, eller 50 % fallback.
- Minimum pådrag basert på temperaturunderskudd og rom-preset (eco / comfort / boost).
- Ramp-begrensning (maks endring per kjøring) og fleksibel avrunding (heltall eller halvt steg).
- Valgfri vifteregulering (boost ved høyt pådrag).
- Valgfri kjøling med sesongbasert styring via `input_select.driftsmodus_vinter_sommer` (VINTER/SOMMER):
  - SOMMER default = kjøling, med tvungen varme-override ved for lav romtemperatur.
  - VINTER default = varme, med tvungen kjøling-override ved for høy romtemperatur.
  - Hysterese brukes for å slå override av igjen og unngå modus-flapping.

Detaljert funksjonsbeskrivelse:
- [README_varmepumpe_regulering.md](./README_varmepumpe_regulering.md)

---

### varsel_printer.yaml — Varsel - Printer - Blekk/Toner lavt

Auto-detekterer printer-/skriversensorer og sender varsel ved lav blekk/toner (under konfigurerbar terskel). Deduper per skriver og filtrerer irrelevante enheter automatisk.

Detaljert funksjonsbeskrivelse:
- [README_varsel_printer.md](./README_varsel_printer.md)

---

## Script blueprints

### varsel_pushover.yaml — Varsel - Pushover Send Melding

Felles script-blueprint for å sende Pushover-varsler med standardisert tittel, melding, TTL-tekst og destination-routing.

Detaljert funksjonsbeskrivelse:
- [README_varsel_pushover.md](./README_varsel_pushover.md)

---
