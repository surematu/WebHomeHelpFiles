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

Example pattern (used consistently in `varsel_batteri.yaml`):
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

## Automation blueprints

### varsel_enhet.yaml — Varsel - Enhet (batteri + signal + uptime)

Samlet overvåkning av batteri-enheter og Uptime Kuma i én blueprint:

- **Time_pattern (hver time):** Sender én samlet varsling med nylig mistet batterisignal + Uptime Kuma-enheter som nylig gikk offline.
- **Planlagt/manuell sjekk:** Sender én samlet varsling med batterinivå, langsomt signal og full Uptime Kuma-status.
- **Kritisk Uptime-sensor:** Kan utløse øyeblikkelig varsling ved statusendring.
- **Viktig regel for alle meldinger med flere seksjoner/lister:** Hvis en enhet er nevnt i en tidligere liste i samme varsel, skal den ikke listes på nytt i senere lister.

---

### ⚠️ varsel_batteri.yaml — Deprecated

Samlet overvåkning av batteri-enheter i tre deler, alle med felles ignore-liste og én debug-toggle:

- **Del 1 – Batteri lavt nivå** (planlagt sjekk): Rapporterer `sensor.*` med `device_class: battery` under terskel (%), og `binary_sensor.*` med `device_class: battery` (digital lav-signal). Deduper per renset navn og beholder laveste verdi.
- **Del 2 – Signal langsomt** (planlagt sjekk, samme tidspunkt som Del 1): Finner batteri-enheter som ikke har rapportert inn innen angitt terskel (standard 72 timer).
- **Del 3 – Signal raskt** (time_pattern – kjøres automatisk med konfigurerbart intervall): Finner enheter som *nylig* har mistet kontakten, ved å varsle kun enheter innenfor varsel-vinduet `last_seen_threshold ≤ alder < check_interval`. Inkluderer oversikt over alle andre aktive batteri-problemer (langsomt signal og lavt batterinivå) i samme varsel.
- **Viktig regel for alle meldinger med flere seksjoner/lister:** Hvis en enhet er nevnt i en tidligere liste i samme varsel, skal den ikke listes på nytt i senere lister.
- Ved **manuell kjøring** formuleres Del 2 nøytralt (`ikke hørt fra`) og ikke som at enhetene "utløste varselet".

Erstattet av `varsel_enhet.yaml`.

---

### effektgrense_automatisk.yaml — KWh-grense - Temperatur + månedsminimum

Setter en `input_number` (kWh-grense) basert på værvarsel (snittemperatur neste N timer) kombinert med et konfigurerbart månedsminimum. Beregner grensen lineært mellom to temperatur/effekt-punkter.

---

### kalender_kalkulert_varmebehov.yaml — Kalender - Kalkulert varmebehov

Beregner når forvarming og normal varme skal være aktiv basert på kalenderhendelser, innetemperatur og værvarsel (snittemperatur neste 24 timer). Aktiverer varme i god tid før hendelsen starter.

---

### temperature_sensor_alarm.yaml — Temperature Sensor Alarm

Sender Pushover-varsel hvis en temperatursensor:
- Går over grense 1 i 15 minutter
- Går over grense 2 i 60 minutter
- Går til `unknown` i 15 minutter

---

### varmepumpe_regulering.yaml — Varmepumpe (Rom) Robot

Regulerer varmepumpe-settpunkt lineært mellom to punkter basert på pådrag (%). Støtter offset ved lav/høy pådrag og kan begrenses til aktive tidsperioder.

---

### varsel_printer.yaml — Varsel - Printer - Blekk/Toner lavt

Auto-detekterer printer-/skriversensorer og sender varsel ved lav blekk/toner (under konfigurerbar terskel). Deduper per skriver og filtrerer irrelevante enheter automatisk.

---

### ⚠️ varsel_uptimekuma.yaml — Deprecated

Erstattet av `varsel_enhet.yaml`.

---

### ⚠️ varsel_signal_batterienhet.yaml — AVVIKLET

Funksjonaliteten er slått sammen med **varsel_batteri.yaml** (Del 2 – Signal langsomt). Beholdes for bakoverkompatibilitet.

---

### ⚠️ varsel_signal_batterienhet_rask.yaml — AVVIKLET

Funksjonaliteten er slått sammen med **varsel_batteri.yaml** (Del 3 – Signal raskt). Beholdes for bakoverkompatibilitet.