# WebHomeHelpFiles

## Automation blueprint versioning rule

When editing files in `blueprints/automation`:

- `2026.7` (or `2026.07`) under represent current month and year. Replace with current date details.
- If the automation is not already on `2026.7.x` / `2026.07.x`, set `Blueprint versjon` to `2026.07.00`.
- If it is already on `2026.7.x` (or `2026.07.x`), increase `x` by `1`.

---

## Automation blueprints

### varsel_batteri.yaml — Varsel - Batteri (nivå + signal)

Samlet overvåkning av batteri-enheter i tre deler, alle med felles ignore-liste og én debug-toggle:

- **Del 1 – Batteri lavt nivå** (planlagt sjekk): Rapporterer `sensor.*` med `device_class: battery` under terskel (%), og `binary_sensor.*` med `device_class: battery` (digital lav-signal). Deduper per renset navn og beholder laveste verdi.
- **Del 2 – Signal langsomt** (planlagt sjekk, samme tidspunkt som Del 1): Finner batteri-enheter som ikke har rapportert inn innen angitt terskel (standard 72 timer).
- **Del 3 – Signal raskt** (time_pattern – kjøres automatisk med konfigurerbart intervall): Finner enheter som *nylig* har mistet kontakten, ved å varsle kun enheter innenfor varsel-vinduet `last_seen_threshold ≤ alder < check_interval`.

Erstattet `varsel_signal_batterienhet.yaml` (Del 2) og `varsel_signal_batterienhet_rask.yaml` (Del 3).

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

### varsel_uptimekuma.yaml — Varsel - UptimeKuma Rapport

Overvåker Uptime Kuma-enheter automatisk (ingen manuell entity-velging nødvendig) ved å oppdage devices som har en entity hvis `friendly_name` slutter på `"Uptime (30 days)"`. Sender planlagte rapporter og umiddelbare varsler ved statusendringer (offline/ustabil).

---

### ⚠️ varsel_signal_batterienhet.yaml — AVVIKLET

Funksjonaliteten er slått sammen med **varsel_batteri.yaml** (Del 2 – Signal langsomt). Beholdes for bakoverkompatibilitet.

---

### ⚠️ varsel_signal_batterienhet_rask.yaml — AVVIKLET

Funksjonaliteten er slått sammen med **varsel_batteri.yaml** (Del 3 – Signal raskt). Beholdes for bakoverkompatibilitet.