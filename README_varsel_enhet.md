# Funksjonsbeskrivelse – Varsel - Enhet (batteri + signal + uptime)

## 1) Formål

Denne automasjonen samler batteri- og tilgjengelighetsovervåkning i ett Pushover-varsel.
Den håndterer lavt batteri, enheter som har vært uten signal over tid, enheter som nylig mistet signal, og Uptime Kuma-status.

## 2) Kjøretid og triggere

- **Planlagt sjekk** på valgt tid/ukedager (standard onsdag 09:05)
- **Rask sjekk** hver 4. time (`time_pattern`) for enheter som nylig mistet signal
- **Øyeblikkelig sjekk** ved statusendring på valgte kritiske Uptime-sensorer (`down` og `down -> up`)

## 3) Hva som sjekkes

### Del 1 – Batterinivå
- Leser `sensor`-entiteter med batteri-verdi (%)
- Leser `binary_sensor`-entiteter med digitalt lavt batteri
- Deduper per enhet/visningsnavn og unngår duplikater i samme varsel

### Del 2 – Signal langsomt
- Finner batteri-enheter som ikke har rapportert innen terskel (`max_age`, standard 72 timer)
- Viser også samlet liste fra terskel og opp

### Del 3 – Signal raskt
- Finner enheter som nettopp passerte terskelen `last_seen_threshold` (standard 4 timer)
- Vinduet er én 4-timers syklus bredt, slik at samme enhet varsles én gang når terskelen passeres

### Del 4 – Uptime Kuma
- Samler Uptime Kuma-enheter og bygger statuslinjer
- Kritiske sensorer kan sende umiddelbart varsel med egen prioritet for offline/online

## 4) Datagrunnlag for "sist sett"

Prioritert rekkefølge:
1. `state_attr(entity, 'last_seen')`
2. Egne `last_seen`-entiteter med parsbar timestamp i state
3. Fallback til `last_changed` for sensor/binary_sensor

## 5) Filtrering og deduplisering

- Én felles ignore-liste for entities og devices brukes i alle delene
- Enheter som allerede er nevnt i en tidligere del av samme melding vises ikke på nytt

## 6) Varsling

- Sender én samlet melding ved planlagt/manuell kjøring
- Ved kritisk Uptime-trigger kan det sendes øyeblikkelig melding
- Støtter separate Pushover-prioriteter for:
  - vanlige varsler
  - kritisk offline
  - kritisk online/annen endring
- `include_debug_details` legger til ekstra sporingsinformasjon i meldingen

## 7) Viktige innganger

- Planlagt tid og ukedager
- Batteriterskel (%)
- `max_age` for langsomt signal
- `last_seen_threshold` for raskt signal
- Kritiske Uptime-sensorer
- Ignore-lister for entities/devices
- Pushover destination, prioritet og TTL

## 8) Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/varsel_enhet.yaml
