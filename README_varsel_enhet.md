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
- Valgfritt: `sensor.home_assistant_running` for restart-deteksjon (se 10.1.1)
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
4. **Del 4 – Uptime Kuma:** Samler status for Uptime Kuma-enheter og bygger statuslinjer. Status `pending` (Uptime Kuma prøver fortsatt å få kontakt) og `maintenance` regnes ikke som offline – enheten varsles først når den faktisk går til `down`. En enhet som står i `pending` kan fortsatt vises under «Ustabil oppetid» hvis oppetiden siste døgn er under 99,5 %.

**Viktig dedupliseringsregel:** Hvis en enhet er nevnt i en tidligere del av samme melding, vises den ikke på nytt i en senere del.

**4-timers syklus:**
Kjøres automatisk hver 4. time. Sender melding om nylig mistet signal og Uptime Kuma-enheter som gikk offline (`down`) siden forrige 4-timers sjekk. Enheter som bare står i `pending` utløser ikke varsel.

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
- Valgfritt: `sensor.home_assistant_running` (restart-deteksjon, se 10.1.1)
- Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome`

### 10.1.1 Restart-deteksjon (`sensor.home_assistant_running`)

**Hva den gjør:** Etter en omstart av Home Assistant får alle entiteter ny `last_changed`. Batterienheter som ikke har rapportert siden omstarten ser da ut som de «mistet signal» samtidig. Blueprinten sammenligner derfor tidspunktet enhetene mistet signal med tidspunktet Home Assistant startet. Hvis **alle** nylig-mistet-enhetene ligger innenfor 10 minutter av oppstarten, blir tittelen «… uten signal etter restart» i stedet for «… mistet signal». Kun tittelen påvirkes – innholdet i varselet er det samme.

**Forutsetning:** Blueprinten leser den hardkodede entiteten `sensor.home_assistant_running`. Den finnes **ikke** i Home Assistant fra før og må opprettes én gang per installasjon. Tilstanden skal være tidspunktet Home Assistant sist startet (timestamp).

**Slik opprettes den (ingen YAML, ingen omstart):**
1. Innstillinger → Enheter og tjenester → Legg til integrasjon → søk **Uptime** (Home Assistants egen, ikke Uptime Kuma) → Send inn.
2. Integrasjonen lager entiteten `sensor.uptime` (kan hete `sensor.oppetid` e.l. avhengig av språk).
3. Åpne entiteten → tannhjul → endre **Entitets-ID** til `sensor.home_assistant_running`. Navn kan settes til «Home Assistant Running».
4. Kontroller i Utviklerverktøy → Tilstander at `sensor.home_assistant_running` viser et tidspunkt.

**Verdt å vite:**
- Rett etter at integrasjonen er lagt til viser sensoren tidspunktet den ble lagt til, ikke forrige omstart. Den blir riktig fra og med neste omstart av Home Assistant.
- Mangler sensoren, virker alt annet som normalt – tittelen blir da alltid «mistet signal».
- I tracen vises verdiene i steget «Steg 1H - HA restart-tid» (`ha_start_ts`, `ha_start_age_s`) og resultatet i «Steg 11A» (`all_offline_at_restart`). `ha_start_ts = 0` betyr at sensoren mangler.

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
