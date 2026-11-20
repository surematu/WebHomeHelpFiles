# Kontaktor – Fellesfeil varsel (overordnet robot)

## 1. Formål

Overordnet robot for en gruppe kontaktorer som overvåkes med «Kontaktor - Overvåking» (én robot per kontaktor). Den sender Pushover for anlegget som helhet: straks når en robot for en kontaktor er skrudd av, en samlet påminnelse så lenge fellesfeilen står, og «Tilbake i normal drift» når feilen er borte. Den gjentar ikke det robotene per kontaktor allerede har varslet, slik at det ikke blir dobbeltvarsling.

Valgfritt kan den også varsle **andre feil** på anlegget enn kontaktorene, f.eks. kaldt varmtvann eller varmepumpe som ikke leverer varme. Feilen avgjøres av en binary_sensor (gjerne en mal-hjelper med forsinkelse). Roboten varsler straks den slår inn, sender «OK igjen» når den er borte, og tar den med i påminnelsen. Det trengs ingen egen automasjon for varslingen.

## 2. Eksempler på bruk

### 2.1 Elkolbe får feil og blir rettet samme dag

1. Roboten for XK3 sender «🔔 Tappevann feil - VVB XK3 …» med hva som er feil.
2. Fellesfeilen slår inn. Fellesfeil-roboten sender **ingenting** (XK3 har allerede varslet).
3. Feilen rettes. Roboten for XK3 sender «✅ Tappevann OK igjen - VVB XK3 …».
4. Fellesfeil-roboten sender ingenting, fordi den ikke har varslet om feilen.

### 2.2 Feilen står over tid

1. Som over: roboten for kontaktoren varsler først.
2. Etter 24 timer sender fellesfeil-roboten «🔔 Tappevann - Fellesfeil (påminnelse)» med årsaken (f.eks. «RS60-62: feil på XK3, XK4.»). Påminnelsen gjentas hver 24. time.
3. Når alt er OK: «✅ Tappevann - Tilbake i normal drift» (i tillegg til «OK igjen» fra kontaktoren).

### 2.3 En robot skrus av (kontaktoren i manuell)

Roboten for en kontaktor skrus av. Kontaktoren overvåkes ikke og kan ikke varsle selv. Etter 1 minutt sender fellesfeil-roboten «🔔 Tappevann - Fellesfeil: Overvåkingen er skrudd AV for: …». Når roboten skrus på igjen og fellesfeilen er borte, kommer «Tilbake i normal drift».

### 2.4 Varmtvannet blir kaldt (andre feil)

1. «Tappevann - RS50-54 Varmtvann» går PÅ når temperaturen ut av berederen har vært under 50 °C i 30 minutter (forsinkelsen ligger i sensoren). Tavla går til Problem og fellesfeilen slår inn.
2. Etter 1 minutt sender roboten «🔔 Tappevann feil - RS50-54 Varmtvann» med årsaken (f.eks. «RS50-54: kaldt varmtvann (44 °C ut).»).
3. Står feilen, kommer den med i den samlede påminnelsen etter 24 timer.
4. Når den er borte: «✅ Tappevann OK igjen - RS50-54 Varmtvann». Er det sendt påminnelse og alt er OK, kommer også «Tilbake i normal drift».

## 3. FAQ – Ofte stilte spørsmål

**Hvorfor sender den ikke varsel med en gang ved alle feil?**
Robotene per kontaktor varsler selv, med mer presis tekst. Fellesfeil-roboten varsler straks bare det de ikke kan varsle om (en robot som er AV), og ellers med en samlet påminnelse.

**Får jeg fortsatt påminnelse per kontaktor?**
Slå av «Påminnelse på faste ukedager» i robotene per kontaktor når denne brukes. Da kommer én samlet påminnelse i stedet for én per kontaktor.

**Hva skjer hvis fellesfeil-roboten selv er skrudd av?**
Da sendes ingen fellesfeil-varsler. Robotene per kontaktor varsler fortsatt. Ta gjerne med «hovedroboten er AV» i fellesfeilen (se 10.2), så det vises som feil i dashbordet.

**Når kommer påminnelsen?**
Når det har gått valgt antall timer (standard 24) siden fellesfeilen kom, eller siden forrige varsel fra denne roboten. Etter omstart av Home Assistant regnes tiden fra omstarten.

**Trenger jeg en egen automasjon for andre feil (f.eks. varmtvann)?**
Nei. Legg sensoren i «Andre feil». Selve feilen (grense og hvor lenge den må stå) avgjøres i sensoren. Roboten varsler, minner på og sender «OK igjen».

**Hvorfor kommer ikke påminnelsen for en annen feil?**
Påminnelsen følger fellesfeilen. Den andre feilen må gi «Problem» på tavla (se eksempelfila), ellers står ikke fellesfeilen.

**Får jeg varsel når temperaturen er lav, men ikke har vært det lenge nok?**
Nei. Tavla viser da «Under sjekk» (gul) på dashbordet og hjemsiden, men det er ikke fellesfeil og sendes ingen varsler. Varselet kommer når forsinkelsen i sensoren har gått.

## 4. Hva slags info trengs

- Fellesfeil (binary_sensor), f.eks. «Tappevann - Fellesfeil».
- Valgfritt: fellesfeil-årsak (sensor med kort tekst), f.eks. «Tappevann - Fellesfeil årsak».
- Robotene per kontaktor (automasjonene fra «Kontaktor - Overvåking»).
- Valgfritt: andre feil (binary_sensor), f.eks. «Tappevann - RS50-54 Varmtvann» og «Tappevann - RS50-54 Varmepumpe».
- Hjelperen «<Anlegg> - Feil sist varslet» (input_datetime med dato og tid).
- Scriptet `script.varsel_pushover_send_melding_webhome`.

## 5. Innstillinger

**Hovedinnganger**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Fellesfeil | – | binary_sensor som er PÅ når anlegget har feil |
| Fellesfeil årsak (valgfri) | tom | Sensor med kort tekst om hva som er feil. Brukes i varselteksten |
| Roboter per kontaktor | tom | Robotene fra «Kontaktor - Overvåking». Er én AV, varsles det med en gang |
| Andre feil (valgfri) | tom | binary_sensor-er for andre feil enn kontaktorene. Varsles når én er PÅ i 1 minutt, «OK igjen» når den er AV. Forsinkelsen legges i sensoren |
| Feil sist varslet | – | input_datetime (dato og tid). 2000-01-01 00:00 = ikke varslet |
| Anlegg i varseltittel | Kontaktor | F.eks. «Tappevann» gir «🔔 Tappevann - Fellesfeil» |

**Varsling (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination (valgfri) | pushover | Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres slik at den blir sendt ulikt. |
| Pushover priority | 1 | −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd), 1 (Høy prioritet, rødt varsel, omgår stilleperiode), 2 (nødvarsel som gjentas til det bekreftes). Brukes for fellesfeil, påminnelse og «Tilbake i normal drift» |
| Levetid varsel og gjentakelse (timer) | 24 | Hvor lenge skal varslet være synlig før det forsvinner? Påminnelsen sendes også så ofte |
| Send varsel når feilen er borte | true | «Tilbake i normal drift», bare hvis denne roboten har varslet om feilen. Også «OK igjen» for andre feil |
| Send varsel ved manuell kjøring | true | Sett til true for å sende varsel når automasjonen kjøres manuelt. Sett til false for å ikke sende varsel ved manuell kjøring. |

> Levetid sendes til scriptet i timer. Scriptet regner om til sekunder, som er det Pushover bruker.

## 6. Funksjonsbeskrivelse

| Når | Trigger | Hva skjer |
|---|---|---|
| En robot for en kontaktor har vært AV i 1 minutt | `robot_off` | Varsel med en gang med hvilke roboter som er AV |
| Fellesfeil har vært PÅ i 1 minutt | `common_fault` | Varsel bare hvis en robot er AV og det ikke er varslet fra før. Ellers ingenting (kontaktorens robot varsler) |
| En av «Andre feil» har vært PÅ i 1 minutt (ikke rett fra «unavailable») | `other_fault` | Varsel med en gang: navnet på feilen og årsaken |
| En av «Andre feil» har vært AV i 1 minutt | `other_fault_cleared` | «OK igjen» for feilen. Står det fortsatt feil, står de i meldingen |
| Fellesfeilen har stått i «gjentakelse» timer siden den kom eller forrige varsel | `reminder_due` | Samlet påminnelse med årsak og hvor lenge feilen har stått |
| Fellesfeil har vært AV i 1 minutt | `common_fault_cleared` | «Tilbake i normal drift», bare hvis det er varslet om feilen. «Feil sist varslet» nullstilles |
| Home Assistant starter / automasjonen skrus på | `ha_start`, `automation_enabled` | Som `common_fault` når fellesfeilen står, og som `common_fault_cleared` når den er borte |

Hver gang det sendes robot AV-varsel eller påminnelse, settes «Feil sist varslet» til nå (ikke ved varsel for andre feil, på samme måte som robotene per kontaktor). Det er det som gjør at påminnelsen kommer på riktig tid, og at «Tilbake i normal drift» bare sendes når det er varslet om feilen.

## 7. Resultat

| Entitet | Hva skrives |
|---|---|
| Feil sist varslet | Tidspunkt for siste varsel, eller 2000-01-01 00:00 når feilen er borte |

## 8. Varsling

**Robot AV:**

- **Tittel:** `🔔 <anlegg> - Fellesfeil`
- **Melding:** `Overvåkingen er skrudd AV for: VVB XK2 (+RS52=434.002-XO01.2) - Robot. Kontaktoren overvåkes ikke før roboten er PÅ igjen. Status: RS50-54: robot AV for XK2. Varselet gjentas etter 24 timer hvis feilen står.`

**Andre feil:**

- **Tittel:** `🔔 <anlegg> feil - <navn på feilen>`, f.eks. `🔔 Tappevann feil - RS50-54 Varmepumpe`. «<Anlegg> - » foran navnet på sensoren tas bort.
- **Melding:** `RS50-54 Varmepumpe har feil siden 20.11. kl. 21:48. Status: RS50-54: varmepumpa leverer ikke varme (tur VP 25 °C, sirkulasjon 25 °C). Påminnelse etter 24 timer hvis feilen står.`

**Andre feil OK igjen:**

- **Tittel:** `✅ <anlegg> OK igjen - <navn på feilen>`
- **Melding:** `RS50-54 Varmepumpe er OK igjen.` Står det fortsatt feil: `Fortsatt feil: …`

**Påminnelse:**

- **Tittel:** `🔔 <anlegg> - Fellesfeil (påminnelse)`
- **Melding:** `RS60-62: feil på XK3, XK4. Feilen har stått siden 20.11. kl. 08:11. Varselet gjentas etter 24 timer hvis feilen står.`

**Tilbake i normal drift:**

- **Tittel:** `✅ <anlegg> - Tilbake i normal drift`
- **Melding:** `Feilen er borte. Det er ingen feil på <anlegg> nå.`

**Manuell kjøring:**

- **Tittel:** `🔔 <anlegg> - Fellesfeil varsel (manuell kjøring)` med fellesfeil, årsak, roboter som er AV, andre feil som er PÅ og om det er varslet.

## 9. Annet

- Navn på automasjonen: «<Anlegg> - Robot», f.eks. «Tappevann - Robot».
- Varslene per kontaktor kommer fra robotene per kontaktor (se [README_kontaktor_overvaking.md](./README_kontaktor_overvaking.md), avsnitt 8).
- Samme oppsett som for snøsmelt: «Snøsmelt - Hent data» sender fellesfeil og robotene per kontaktor sender detaljene.

## 10. Avansert

### 10.1 Forutsettninger

- Home Assistant 2025.11.0 eller nyere.
- «Kontaktor - Overvåking» satt opp med feil-hjelper per kontaktor.
- Fellesfeil og årsak, f.eks. fra [packages/kontaktor_overvaking_status_eksempel.yaml](./packages/kontaktor_overvaking_status_eksempel.yaml).
- `input_datetime.<anlegg>_feil_sist_varslet` med dato og tid. Sett den til 2000-01-01 00:00 når den er laget.
- `script.varsel_pushover_send_melding_webhome`.

### 10.2 Eksempler

```yaml
alias: Tappevann - Robot
use_blueprint:
  path: surematu/kontaktor_fellesfeil.yaml
  input:
    common_fault: binary_sensor.tappevann_fellesfeil
    common_fault_reason: sensor.tappevann_fellesfeil_arsak
    fault_notified: input_datetime.tappevann_feil_sist_varslet
    notify_prefix: Tappevann
    robots:
      - automation.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_robot
      - automation.tavle_rs52_vvb_xk2_rs52_434_002_xo01_2_robot
      # … alle robotene per kontaktor
    other_faults:                     # valgfri
      - binary_sensor.tappevann_rs50_54_varmtvann_feil
      - binary_sensor.tappevann_rs50_54_varmepumpe_feil
```

Andre feil lages som mal-hjelpere (binary_sensor) med forsinkelse. Eksempel på varmtvann og varmepumpe, og hvordan de tas med i tavlestatus og årsak, ligger i [packages/kontaktor_overvaking_status_eksempel.yaml](./packages/kontaktor_overvaking_status_eksempel.yaml).

Fellesfeilen står når en tavle har «Avvik» (gul) eller «Problem» (rød). «Under sjekk» (gul, lav temperatur som ikke har vart lenge nok) er ikke feil og gir ingen varsler. Ta med hovedroboten i fellesfeilen, så den vises som feil når den er AV:

```yaml
state: >-
  {{ ['sensor.tappevann_rs50_54_status', 'sensor.tappevann_rs60_62_status']
     | select('is_state', ['Avvik', 'Problem']) | list | count > 0
     or not is_state('automation.tappevann_robot', 'on') }}
```

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| `kontaktor_overvaking.yaml` | Robot per kontaktor. Varsler hva som er feil på kontaktoren |
| `scripts/varsel_pushover.yaml` | Sender Pushover-varslene |
| `snosmelt_hent_data.yaml` | Tilsvarende fellesfeil-varsel for snøsmelt |

### 10.4 Beregnede verdier og variabler

| Steg | Variabel | Beskrivelse |
|---|---|---|
| 2 | `trigger_id`, `trigger_text`, `trigger_robot`, `trigger_other` | Hvorfor den kjørte, hvilken robot som ble skrudd av, og hvilken annen feil som slo inn eller er borte |
| 4 | `fault_on`, `fault_since`, `reason_text`, `robot_list`, `robots_off` | Fellesfeil, siden når, årsak og hvilke roboter som er AV |
| 4 | `others_on`, `trigger_other_name`, `trigger_other_since` | Andre feil som er PÅ, og navn og tidspunkt for den som utløste kjøringen |
| 5 | `notified_ts`, `notified`, `can_notify` | Om det er varslet om feilen |
| 6 | `send_robot_alert`, `send_other_alert`, `send_other_ok`, `send_reminder`, `send_ok`, `decision_text` | Hva som sendes, og hele vurderingen i én setning |

### 10.5 Feilhåndtering

| Scenario | Håndtering |
|---|---|
| Fellesfeil hopper av og på i under 1 minutt | Ingen kjøring |
| Årsak-sensoren mangler eller er utilgjengelig | Varselet sier «Fellesfeil er aktiv.» |
| En robot i listen finnes ikke | Regnes som AV og vises med entitets-ID |
| En av «Andre feil» lastes inn på nytt (PÅ → unavailable → PÅ) | Ikke nytt varsel |
| En av «Andre feil» er ikke med i tavlestatus | Varsel og «OK igjen» kommer, men ingen påminnelse og ingen rød fellesfeil |
| Omstart av Home Assistant | Påminnelsen regnes fra omstarten. Er feilen borte og det er varslet, sendes «Tilbake i normal drift» |

### 10.6 Varsling og debug info

Ingen egne debug-varsler. Se `decision_text` i steg 6 i sporloggen (steg 7–12 sender). Kjør automasjonen manuelt for å få status på Pushover.

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/kontaktor_fellesfeil.yaml
- Robot per kontaktor: https://github.com/surematu/WebHomeHelpFiles/blob/main/README_kontaktor_overvaking.md
- Installasjon på nytt anlegg: https://github.com/surematu/WebHomeHelpFiles/blob/main/README_kontaktor_installasjon.md
