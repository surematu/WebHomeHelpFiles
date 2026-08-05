# Varsel – Enhet (batteri + signal + uptime)

## 1. Formål

Denne automasjonen samler overvåkning av alle batteridrevne enheter og Uptime Kuma-tjenester i ett enkelt Pushover-varsel.

Du får én samlet oversikt over lavt batteri, enheter som ikke har rapportert på lang tid, enheter som nettopp mistet signal, og status på tjenester overvåket via Uptime Kuma.

## 2. Eksempler på bruk

- **Lavt batteri:** Varsel onsdag morgen: «Kjøkkenvindu-sensor: 15 %, Dørklokke: 8 %»
- **Signal mistet:** En temperatursensor på hytta har ikke rapportert på 3 dager. Varslet vises i ukentlig sjekk.
- **Raskt signal-tap:** En sensor mistet kontakt for 5 timer siden. Du får varsel neste 4-timers syklus.
- **Uptime Kuma offline:** En viktig tjeneste (f.eks. nettverkskamera) går offline → umiddelbart varsel.
- **Uptime Kuma online igjen:** Tjenesten er tilbake → varsel om at den er oppe igjen.

## 3. FAQ – Ofte stilte spørsmål

**Hva er Uptime Kuma?**
Uptime Kuma er et verktøy for å overvåke om tjenester og nettsider er tilgjengelige. Home Assistant kan vise status fra Uptime Kuma som sensorer.

**Hva er forskjellen på «langsomt signal» og «raskt signal»?**
«Langsomt signal» (Del 2) rapporterer enheter som ikke har kommunisert på mer enn 72 timer (standard). «Raskt signal» (Del 3) fanger opp enheter som nettopp passerte 4-timersterskelen – slik at du varsles raskere uten å drukne i varsler.

**Kan jeg ignorere spesifikke enheter?**
Ja, du kan legge til enheter eller devices i ignore-listene. De vil da utelates fra alle rapporter.

**Sender den varsel selv om alt er OK?**
Nei, ved planlagt sjekk sendes kun varsel hvis det faktisk er noe å rapportere (lavt batteri, mistet signal, Uptime-avvik).

**Hva er «kritisk Uptime-sensor»?**
Sensorer du velger som kritiske vil trigge umiddelbart varsel – uten å vente på planlagt kjøretid.

## 4. Hva slags info trengs

- Batteridrevne enheter i Home Assistant (oppdages automatisk)
- Valgfritt: Uptime Kuma-sensorer
- Valgfritt: kritiske Uptime-sensorer for umiddelbar varsling
- Valgfritt: ignore-lister for enheter/devices som skal ekskluderes
- Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome`

## 5. Innstillinger

**Planlagt sjekk:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Tid for planlagt sjekk | 09:05 | Klokkeslett for ukentlig sjekk |
| Ukedag(er) | Onsdag | Ukedager sjekken kjøres |

**Filtrering (gjelder alle sjekkene):**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Ignorer entities | (tomt) | Spesifikke entiteter som utelates fra alle rapporter |
| Ignorer devices | (tomt) | Devices der alle batterisensorer utelates |

**Del 1 – Batterinivå:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Terskel for lavt batteri (%) | 30 | Varsle når batterinivå er under denne verdien |

**Del 2 – Signal langsomt:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Maks tid siden sist signal (timer) | 72 | Varsle hvis enhet ikke er sett på mer enn dette |

**Del 3 – Signal raskt:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Nedre grense – min. tid siden sist signal (timer) | 4 | Fanger opp enheter som nettopp passerte terskelen |

**Del 4 – Uptime Kuma:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Kritiske status-sensorer | (tomt) | Sensorer som trigger umiddelbart varsel |

**Varsling (Valgfri):**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination | pushover | Mottakergruppe for vanlige varsler |
| Pushover prioritet – generell | 0 | Prioritet for vanlige varsler |
| Pushover prioritet – kritisk offline | 1 | Prioritet når kritisk Uptime-sensor går offline |
| Pushover prioritet – kritisk online | −1 | Prioritet når kritisk Uptime-sensor er online igjen |
| Pushover TTL (sekunder) | 604800 | Levetid for varselet (604800 = 7 dager) |
| Legg til debug-detaljer | false | Legg til ekstra sporingsinformasjon i meldingen |

## 6. Funksjonsbeskrivelse

**Planlagt/manuell sjekk:**
Én samlet melding sendes med alle funn fra de fire delene:

1. **Del 1 – Batterinivå:** Leser alle sensor-entiteter med batteriprosent og binary_sensor-entiteter med «lavt batteri»-indikasjon. Enheter under terskelen listes opp.
2. **Del 2 – Signal langsomt:** Finner batteridrevne enheter som ikke har rapportert innen `max_age` (standard 72 timer). Viser også samlet liste fra terskel og opp.
3. **Del 3 – Signal raskt:** Finner enheter som nettopp passerte `last_seen_threshold` (standard 4 timer). Vinduet er én 4-timers syklus bredt, slik at samme enhet varsles én gang.
4. **Del 4 – Uptime Kuma:** Samler status for Uptime Kuma-enheter og bygger statuslinjer.

**Viktig dedupliseringsregel:** Hvis en enhet er nevnt i en tidligere del av samme melding, vises den ikke på nytt i en senere del.

**4-timers syklus:**
Kjøres automatisk hver 4. time. Sender melding om nylig mistet signal og Uptime Kuma-enheter som nylig gikk offline.

**Kritisk Uptime-trigger:**
Kritisk-merkede Uptime-sensorer trigger umiddelbart varsel ved statusendring (offline eller online igjen), med egen prioritet.

## 7. Resultat

Ingen entiteter skrives til. Resultatet er ett eller flere Pushover-varsler:
- Planlagt/manuell sjekk: én samlet melding
- Kritisk Uptime-trigger: umiddelbar melding

## 8. Varsling

Varsling er aktiv som standard (pushover destination er satt til `pushover`).

**Planlagt sjekk – eksempel på melding:**
> **Lavt batteri:**
> - Kjøkkenvindu: 15 %
> - Dørklokke: 8 %
>
> **Signal langsomt (>72t):**
> - Hytte-sensor – sist sett: 4 dager siden

**Kritisk Uptime offline:**
> **🔴 Offline:**
> - Nettverkskamera | 5 min / 98–100%

**Kritisk Uptime online igjen:**
> **🟢 Online igjen:**
> - Nettverkskamera

## 9. Annet

### 9.1 Prioritering av «sist sett»-data

For å fastslå når en enhet sist rapporterte brukes (i prioritert rekkefølge):
1. Attributtet `last_seen` på entiteten
2. Egne `last_seen`-entiteter med parsbar timestamp
3. `last_changed` for sensor/binary_sensor som fallback

## 10. Avansert

### 10.1 Forutsettninger

- Batteridrevne enheter i Home Assistant med batteri-sensorer
- Valgfritt: Uptime Kuma-integrasjon
- Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome`

### 10.2 Eksempler

Ingen YAML-eksempler for denne automasjonen.

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for Pushover-utsending |

### 10.4 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `slow_list_raw` | Rå liste over enheter med langsomt signal |
| `slow_list_clean` | Renset og deduplisert liste |
| `fast_list_raw` | Rå liste over enheter med nylig mistet signal |
| `low_list_percent_clean` | Renset liste med lavt batteriprosent |
| Uptime-statuslinjer | Formaterte linjer per Uptime Kuma-sensor |

### 10.5 Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| Ingen avvik funnet | Ingen varsel sendes |
| Entitet utilgjengelig | Hoppes over, inngår ikke i rapport |
| Kritisk Uptime-sensor endrer status | Umiddelbart varsel med kritisk prioritet |

### 10.6 Varsling og debug info

- Sett «Legg til debug-detaljer i varselet» til `true` (i Varsling-seksjonen) for ekstra sporingsinformasjon i varselet
- Separate Pushover-prioriteter for: vanlig varsel, kritisk offline, kritisk online/annen endring

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/varsel_enhet.yaml
- Pushover script: [README_varsel_pushover.md](./README_varsel_pushover.md)
