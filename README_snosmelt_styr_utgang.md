# Snøsmelt – Styr utgang (én kontaktor)

## 1. Formål

Styrer én utgang (f.eks. en kontaktor for varmekabel) ut fra «Snøsmelt behov» fra automasjonen «Snøsmelt - Hent data». Det lages én automasjon per utgang, slik at en enkelt kontaktor kan settes i manuell ved å skru av sin egen automasjon. Automasjonen kan også overvåke last og spoleeffekt og sende varsel via Pushover når utgangen er PÅ uten at det trekkes forventet effekt.

## 2. Eksempler på bruk

### 2.1 Vanlig drift

«Snøsmelt behov» går PÅ. Etter en tilfeldig ventetid på 0–30 sekunder slås kontaktoren PÅ, slik at flere kontaktorer ikke legger inn i samme sekund. Når behovet går AV, slås kontaktoren AV.

### 2.2 Manuell styring av én kontaktor

Skru av automasjonen for den ene kontaktoren. Da røres ikke utgangen, og den kan styres for hånd. De andre kontaktorene går som normalt.

### 2.3 Varsel om feil

Kontaktoren er PÅ, forventet last er 6500 W, men det måles 0 W i 2 minutter. Du får varselet «⚠️ Snøsmelt feil - Snø Q1-2» med målt verdi og hva som bør sjekkes.

### 2.4 Redusert pådrag

Pådrag settes til 50 % med periode 10 minutter. Ved behov er utgangen PÅ i 5 minutter og AV i 5 minutter. Med ulik offset på to utganger slår de ikke inn samtidig.

## 3. FAQ – Ofte stilte spørsmål

**Må jeg bruke overvåkningen?**
Nei. La feltene for effekt- og spolesensor stå tomme, så styres bare utgangen.

**Får jeg varsel når det ikke er snøsmelting?**
Nei. Lav last og lav spoleeffekt sjekkes bare når utgangen er PÅ. Det eneste som sjekkes når utgangen er AV, er om kontaktoren henger inne (last uten at utgangen er PÅ).

**Hvorfor er det en forsinkelse før feil?**
Lasten kommer noen sekunder etter innkobling, og små spoleeffekter kan måles som 0 W i korte perioder. Forsinkelsen (standard 2 minutter) hindrer falske varsler.

**Hva gjør «Feil-hjelper»?**
Den husker at det er feil. Da får du ett varsel per feil, og et varsel når feilen er borte. Uten den sendes varsel hver gang feilen oppstår på nytt, for eksempel i hver puls når pådrag er under 100 %.

**Kan jeg slå utgangen av eller på for hånd mens automasjonen er på?**
Nei, den rettes tilbake etter startforsinkelsen + 5 sekunder (35 sekunder som standard). Skru av automasjonen for kontaktoren først.

**Hva skjer hvis «Snøsmelt behov» er utilgjengelig?**
Det tolkes som AV, og utgangen slås AV.

**Hva skjer når automasjonen er skrudd av?**
Utgangen styres ikke, og det sendes ingen varsler for den utgangen – heller ikke «ikke på» eller planlagt sjekk. Når den skrus på igjen, settes utgangen riktig med en gang.

## 4. Hva slags info trengs

- «Snøsmelt behov» fra «Snøsmelt - Hent data».
- Bryteren som styrer kontaktoren.
- Valgfritt: sensor for målt last og forventet last, sensor for spoleeffekt og forventet spoleeffekt.
- Scriptet `script.varsel_pushover_send_melding_webhome` hvis varsling skal brukes.

## 5. Innstillinger

**Hovedinnganger**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Snøsmelt behov | – | input_boolean (eller binary_sensor) som utgangen følger |
| Utgang | – | Bryteren som styrer kontaktoren |
| Navn i varsel (valgfri) | tom | Brukes i varseltittel. Tom = navnet til bryteren |

**Overvåkning (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Effekt – målt last (valgfri) | tom | Sensor for effekten til varmekabelen |
| Effekt – forventet last | 0 | Normal effekt når utgangen er PÅ. Samme enhet som sensoren |
| Spole – målt effekt (valgfri) | tom | Sensor for effekten til kontaktorspolen |
| Spole – forventet effekt | 0 | Normal spoleeffekt. Samme enhet som sensoren |
| Forsinkelse før feil | 2 min | Avviket må vare sammenhengende så lenge |
| Last – laveste godkjente andel | 70 % | Feil når målt last er under denne andelen av forventet |
| Spole – laveste godkjente andel | 30 % | Feil når målt spoleeffekt er under denne andelen av forventet |
| Henger inne – grense | 10 % | Feil når utgangen er AV og lasten er over denne andelen av forventet |
| Varsle når utgangen ikke er PÅ ved behov | true | Feil når «Snøsmelt behov» er PÅ, men utgangen ikke er PÅ. Brukes bare når pådrag er 100 % |
| Feil-hjelper (valgfri) | tom | input_boolean som husker feil (se FAQ) |

**Innstillinger**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Tilfeldig startforsinkelse – maks | 30 s | Når behovet slår inn ventes tilfeldig 0–maks sekunder før innkobling. 0 = av. Må være kortere enn «Forsinkelse før feil» |
| Pådrag | 100 % | Andel av perioden utgangen er PÅ ved behov |
| Periode | 10 min | Lengden på én puls-syklus (brukes når pådrag < 100 %) |
| Offset | 0 min | Forskyver syklusen mellom utganger |

**Varsling (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination (valgfri) | pushover | Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres slik at den blir sendt ulikt. |
| Pushover priority | 1 | −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd), 1 (Høy prioritet, rødt varsel, omgår stilleperiode), 2 (nødvarsel som gjentas til det bekreftes). |
| Levetid varsel (timer) | 168 | Hvor lenge skal varslet være synlig før det forsvinner? |
| Tid for planlagt sjekk | 09:00 | Tidspunkt for påminnelse hvis en feil fortsatt står |
| Ukedag(er) for planlagt sjekk | Onsdag | Hvilke dager påminnelsen sendes |
| Send varsel når feilen er borte | true | Krever «Feil-hjelper» |
| Send varsel ved manuell kjøring | true | Sett til true for å sende varsel når automasjonen kjøres manuelt. Sett til false for å ikke sende varsel ved manuell kjøring. |

> Levetid sendes til scriptet i timer. Scriptet regner om til sekunder, som er det Pushover bruker.

## 6. Funksjonsbeskrivelse

Automasjonen kjøres bare når noe skjer, slik at hver kjøring i sporloggen betyr noe:

| Når | Trigger |
|---|---|
| «Snøsmelt behov» endrer seg | `demand_changed` |
| Utgangen står feil i forhold til behovet i mer enn startforsinkelsen + 5 sekunder (f.eks. slått av eller på for hånd) | `output_mismatch` |
| Utgangen kommer tilbake fra utilgjengelig | `switch_recovered` |
| Home Assistant starter | `ha_start` |
| Automasjonen skrus PÅ | `automation_enabled` |
| Hvert 15. minutt, som sikkerhetssjekk (kun ved pådrag 100 %) | `safety_check` |
| Hvert minutt (kun ved pådrag under 100 %, pulsingen trenger det) | `pulse_tick` |
| En overvåkning har slått ut, eller utgangen er bekreftet OK | `fault_*`, `ok_verified` |
| Planlagt sjekk på faste ukedager | `scheduled_check` |

**Styring**

1. Leser «Snøsmelt behov».
2. Beregner fase i puls-syklusen: `(minutt i døgnet + offset) % periode`.
3. Ønsket tilstand er PÅ når det er behov og (pådrag er 100 % eller fasen er innenfor på-tiden).
4. Slår utgangen PÅ eller AV bare hvis den står feil.
5. Skal utgangen PÅ fordi behovet nettopp slo inn (eller Home Assistant nettopp startet), ventes først et tilfeldig antall sekunder mellom 0 og «tilfeldig startforsinkelse». Etter ventetiden slås utgangen PÅ bare hvis det fortsatt er behov. Utkobling, og innkobling når automasjonen skrus PÅ, skjer uten ventetid.

**Overvåkning**

| Feil | Vilkår (må vare i «forsinkelse før feil») |
|---|---|
| Lav last | Utgangen er PÅ og målt last < forventet last × laveste andel |
| Lav spoleeffekt | Utgangen er PÅ og målt spoleeffekt < forventet spoleeffekt × laveste andel |
| Henger inne | Utgangen er AV og målt last > forventet last × «henger inne»-grense |
| Ikke på | «Snøsmelt behov» er PÅ og utgangen er ikke PÅ (av eller utilgjengelig). Kun ved pådrag 100 % |
| Bekreftet OK | Utgangen er PÅ og målt last ≥ grensen (uten lastmåling brukes spoleeffekten) |

Ved feil slås «Feil-hjelper» PÅ (hvis valgt) og feilvarsel sendes. Ved «bekreftet OK» slås hjelperen AV og det sendes varsel om at feilen er borte.

**Planlagt sjekk**

På valgte ukedager og tidspunkt (standard onsdag 09:00) kontrolleres det om en feil står akkurat da. I så fall sendes en påminnelse med alle feilene som gjelder. Står ingen feil, sendes ingenting.

## 7. Resultat

| Entitet | Hva skrives |
|---|---|
| Utgang | `on` eller `off` |
| Feil-hjelper (valgfri) | PÅ ved feil, AV ved bekreftet OK |

## 8. Varsling

**Feil (aktiv når en målesensor og forventet verdi er lagt inn):**

- **Tittel:** `⚠️ Snøsmelt feil - <navn>`
- **Melding (lav last):** `Utgangen er PÅ, men lasten er 0 (forventet ca. 6500, grense 4550). Sjekk sikring, kontaktor og varmekabel.`
- **Melding (lav spoleeffekt):** `Utgangen er PÅ, men spoleeffekten er 0.0 (forventet ca. 2.5, grense 0.8). Sjekk reléutgang og kontaktorspole.`
- **Melding (henger inne):** `Utgangen er AV, men det måles fortsatt last: 6480 (grense 650). Kontaktoren kan henge inne.`
- **Melding (ikke på):** `Det er behov for snøsmelting, men utgangen er ikke PÅ (tilstand: off). Sjekk at utgangen svarer og ikke er slått av manuelt.`

**Påminnelse ved planlagt sjekk (kun når en feil står):**

- **Tittel:** `⚠️ Snøsmelt feil (påminnelse) - <navn>`
- **Melding:** én linje per feil som står.

**OK igjen (krever «Feil-hjelper»):**

- **Tittel:** `✅ Snøsmelt OK igjen - <navn>`

**Manuell kjøring av automasjonen:**

- **Tittel:** `🔔 Snøsmelt - Styr utgang (manuell kjøring)` med behov, pådrag, ønsket utgang og måleverdier.

## 9. Annet

- Med pådrag under 100 % må på-tiden i hver puls være lengre enn «forsinkelse før feil», ellers rekker ikke overvåkningen å slå ut.
- Syklusen er basert på minutter siden midnatt. Perioder som går opp i 1440 (10, 15, 20, 30, 60 …) gir lik syklus hver dag.
- Måleverdi og forventet verdi må ha samme enhet (normalt W).
- Blueprintet skriver bare til den valgte utgangen. Ikke la to automasjoner styre samme utgang.
- Under den tilfeldige ventetiden står andre kjøringer av automasjonen i kø. Slår behovet av i ventetiden, blir utgangen ikke slått PÅ.

## 10. Avansert

### 10.1 Forutsettninger

- Home Assistant 2025.11.0 eller nyere.
- «Snøsmelt - Hent data» satt opp, med hjelperen «Snøsmelt behov» (`input_boolean.snosmelt_behov`).
- En switch-entitet for utgangen.
- `script.varsel_pushover_send_melding_webhome` (fra `blueprints/scripts/varsel_pushover.yaml`) hvis varsling brukes.
- Valgfritt: én input_boolean per utgang som «Feil-hjelper», f.eks. `input_boolean.snosmelt_q1_2_feil`.

### 10.2 Eksempler

**Automasjon fra blueprint (YAML):**
```yaml
alias: Snøsmelt - Styr utgang - Q1-2
use_blueprint:
  path: surematu/snosmelt_styr_utgang.yaml
  input:
    demand_entity: input_boolean.snosmelt_behov
    output_switch: switch.tavle_rs52_sno_q1_2_rs52_433_002_xo01_1
    power_sensor: sensor.tavle_rs52_rs52_433_002_xi1_sno_q1_2_effekt_kalkulert_1
    power_expected: 6500
    coil_sensor: sensor.tavle_rs52_sno_q1_2_rs52_433_002_xo01_1_kontaktor_effekt
    coil_expected: 2.5
```

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| `snosmelt_hent_data.yaml` | Beregner «Snøsmelt behov» |
| `pwm_output.yaml` | Generell PWM-styring av en bryter fra et 0–100 %-signal |
| `scripts/varsel_pushover.yaml` | Sender Pushover-varslene |

### 10.4 Beregnede verdier og variabler

Automasjonen er bygget for å være enkel å etterprøve i sporloggen (Trace): hvert steg gjør én ting, og de viktigste stegene har en tekst eller tabell som oppsummerer vurderingen.

| Steg | Variabel | Beskrivelse |
|---|---|---|
| 2 | `trigger_id`, `trigger_text` | Hvorfor automasjonen kjørte, som ID og i klartekst (f.eks. «Snøsmelt behov endret seg», «Utgangen sto feil i forhold til behovet») |
| 3 | `output_name` | Navn brukt i varsel |
| 4 | `demand_state`, `demand_on`, `current_switch_state` | Behovet og utgangen slik de sto da kjøringen startet |
| 5 | `duty`, `period`, `phase`, `on_minutes`, `pulse_on` | Puls-beregning. `pulse_on` er alltid true ved 100 % pådrag |
| 6 | `should_be_on`, `planned_action`, `decision_text` | Ønsket tilstand, hva som gjøres («slå på», «slå av» eller «ingen endring»), og hele vurderingen i én setning |
| 7 | `start_delay_s` | Tilfeldig ventetid før innkobling i denne kjøringen (0 når den ikke brukes) |
| 8 | `switch_state_now`, `power_now`, `coil_now`, `power_limit`, `coil_limit`, `stuck_limit` | Måleverdier etter at utgangen er satt, og grensene regnet ut fra forventet verdi og prosent |
| 9 | `has_power`, `has_coil`, `has_not_on_check` | Hvilke overvåkninger som er i bruk |
| 10 | `fault_now_not_on`, `fault_now_power_low`, `fault_now_coil_low`, `fault_now_stuck` | Hvilke feil som står akkurat nå |
| 11 | `monitor_table` | Én rad per sjekk: `sjekk`, `i_bruk`, `malt`, `grense`, `feil_na` |
| 12 | `latch_configured`, `latch_was_on`, `can_notify` | Feil-hjelper, og om varsel kan sendes |
| 13 | `fault_now_lines` | Feiltekstene som brukes av planlagt sjekk |
| 14 | `fault_message`, `fault_should_notify` | Feiltekst og om varsel skal sendes, når en overvåkning har slått ut |

Eksempel på `decision_text`: «Behov PÅ (on), pådrag 100 % → utgangen skal være PÅ. Utgangen er off → slå på.»

Overvåkningen bruker template-triggere med `trigger_variables` (`tv_*`), slik at vilkårene må være sanne sammenhengende i «forsinkelse før feil». Selve ventetiden vises ikke i sporloggen. `trigger_text` sier hvilken overvåkning som slo ut, og `monitor_table` viser verdiene i det kjøringen startet.

Triggeren `automation_enabled` er en template-trigger på automasjonens egen tilstand (`this.entity_id`). Den slår til i det automasjonen skrus PÅ.

### 10.5 Feilhåndtering

| Scenario | Håndtering |
|---|---|
| «Snøsmelt behov» utilgjengelig/ukjent | Tolkes som AV → utgangen slås AV |
| Utgangen utilgjengelig | Ingen kommando sendes. Riktig tilstand settes når den kommer tilbake |
| Målesensor utilgjengelig | Ingen feil meldes for lav last/spole (verdien kan ikke vurderes) |
| Forventet verdi er 0 | Overvåkningen for den målingen er av |
| Kommando feiler | Feilen logges. Sikkerhetssjekken prøver på nytt innen 15 minutter (1 minutt ved pådrag under 100 %). «Ikke på ved behov» varsler etter «forsinkelse før feil» |
| Utgangen slås av eller på for hånd mens automasjonen er på | Rettes etter startforsinkelsen + 5 sekunder |
| Spoleeffekten faller kort til 0 | Fanges av «forsinkelse før feil». «Bekreftet OK» bruker last når lastmåling finnes |

### 10.6 Varsling og debug info

Ingen egne debug-varsler. Feilsøking gjøres i sporloggen (Trace) til automasjonen. Blueprintet lagrer de 30 siste kjøringene (standard i Home Assistant er 5). Ved pådrag 100 % kjører automasjonen bare når noe skjer, pluss sikkerhetssjekken hvert 15. minutt, så 30 kjøringer dekker flere timer.

| Spørsmål | Se på steg | Variabel |
|---|---|---|
| Hvorfor kjørte den nå? | 2 | `trigger_text` |
| Hvorfor ble utgangen slått på eller av, eller ikke rørt? | 6 | `decision_text` |
| Hvor lenge ventet den før innkobling? | 7-A | `start_delay_s` |
| Hva var målt, og hva var grensen? | 11 | `monitor_table` |
| Hvorfor ble det (ikke) sendt varsel? | 12 og 14 | `can_notify`, `latch_was_on`, `fault_should_notify` |

Ved pådrag under 100 % kjører automasjonen hvert minutt, og de fleste kjøringene er da minuttsjekker. Kjør automasjonen manuelt for å få status tilsendt på Pushover.

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/snosmelt_styr_utgang.yaml
- Overordnet: https://github.com/surematu/WebHomeHelpFiles/blob/main/README_snosmelt_hent_data.md
- Template-trigger: https://www.home-assistant.io/docs/automation/trigger/#template-trigger
