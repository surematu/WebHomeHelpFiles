# Kontaktor – Overvåking (én kontaktor)

## 1. Formål

Overvåker én kontaktor (f.eks. elkolbe i varmtvannsbereder, varmekabel eller annen fast last) og varsler via Pushover når den ikke ligger inne som forventet, når spolen ikke trekker, når lasten mangler eller ikke når full effekt, når kontaktoren henger inne, eller når reléet melder vern. Det lages én automasjon per kontaktor fra samme blueprint, slik at samme logikk brukes på alle og alle grenser justeres på ett sted per kontaktor. Automasjonen styrer ingenting som standard, men kan valgfritt slå kontaktoren PÅ igjen hvis den skal være alltid PÅ.

## 2. Eksempler på bruk

### 2.1 Elkolbe i varmtvannsbereder (alltid PÅ)

Kontaktoren for elkolben skal alltid ligge inne, og termostaten i berederen styrer selve oppvarmingen. Automasjonen:

- varsler hvis kontaktoren er AV eller utilgjengelig i 5 minutter,
- varsler hvis spolen trekker under 30 % av normal spoleeffekt i 2 minutter (kontaktoren trekker ikke inn),
- varsler hvis det ikke er last i 60 minutter (sikring, element eller termostat),
- varsler hvis lasten ikke har vært oppe i full effekt på 24 timer (f.eks. ett av tre elementer er defekt).

Termostaten kobler ut og inn hele tiden, så «lav last» i seg selv er ikke feil. Derfor brukes lange forsinkelser på lastsjekkene.

### 2.2 Kontaktor som styres av noe annet

Sett «Forventet tilstand» til «Ingen fast tilstand». Da sjekkes spole og last bare når kontaktoren er PÅ, og «henger inne» når den er AV. Det kommer ingen feil fordi den er AV.

### 2.3 Slå PÅ igjen automatisk

Har et relé startet opp igjen med utgangen AV etter strømbrudd, kan automasjonen slå den PÅ igjen. Valget er AV som standard. Da varsles det bare.

### 2.4 Varsel om feil

Kontaktoren for «VVB XK1» er PÅ, full last er 6500 W, men det måles 0 W i 60 minutter. Du får varselet «🔔 Tappevann feil - VVB XK1 (+RS52=434.002-XO01.1)» med målt verdi og hva som bør sjekkes.

## 3. FAQ – Ofte stilte spørsmål

**Må jeg bruke alle sjekkene?**
Nei. La spolesensor stå tom (eller forventet spoleeffekt 0) for å slå av spolesjekken. La lastsensor stå tom (eller full effekt 0) for å slå av alle lastsjekker. Sett «Ikke full last – grense» til 0 for å slå av bare den.

**Hva skal jeg skrive inn som «full effekt»?**
Det sensoren faktisk viser når hele lasten er inne, ikke merkeeffekten. Se på historikken for sensoren et par døgn og bruk det høyeste vanlige nivået.

**Hvorfor varierer lasten mellom flere nivåer?**
Typisk for elkolber med flere elementer og egne termostater, og for målinger der bare én leder måles. I et IT-nett med én strømtang per kurs faller målt effekt til ca. 58 % (1/√3) når ett av elementene som henger på den målte lederen kobler ut. Det er normal drift, derfor er det «ingen last over tid» og «ikke full last på et døgn» som brukes som feil.

**Kan alle feil oppdages?**
Nei. Med én strømtang per kurs vises ikke et dødt element som ikke henger på den målte lederen. Spolesjekken viser bare at kontaktoren trekker inn, ikke at hovedkontaktene leder.

**Får jeg flere varsler for samme feil?**
Nei. Hver sjekk varsler én gang når avviket har vart hele forsinkelsen. Den varsler på nytt bare hvis avviket forsvinner og kommer tilbake. I tillegg kommer en påminnelse på faste ukedager så lenge en feil står.

**Hva gjør «Feil-hjelper»?**
En input_boolean som slås PÅ ved feil og AV når kontaktoren er bekreftet OK igjen. Den brukes til feillampe i dashbordet og til tavlestatus/fellesfeil, og den gir varsel når feilen er borte. Den kan slås av for hånd (kvittering). Er feilen der fortsatt, slås den PÅ igjen ved neste feil.

**Hva skjer når automasjonen er skrudd av?**
Kontaktoren overvåkes ikke, og det sendes ingen varsler for den. Bruk tavlestatus-eksemplet i 10.2, så vises en avslått automasjon som feil i dashbordet, og bruk «Kontaktor - Fellesfeil varsel» ([README_kontaktor_fellesfeil.md](./README_kontaktor_fellesfeil.md)), så varsles det med en gang.

**Hvordan unngår jeg dobbeltvarsling med en overordnet robot?**
Roboten per kontaktor varsler hva som er feil og når den er OK igjen. «Kontaktor - Fellesfeil varsel» varsler bare det kontaktorene ikke kan (en robot som er AV), en samlet påminnelse hver 24. time, og «Tilbake i normal drift» bare hvis den selv har varslet. Slå av «Påminnelse på faste ukedager» i robotene per kontaktor når den brukes.

**Hva skjer ved omstart av Home Assistant, eller når automasjonen skrus på?**
Tidtakerne for forsinkelsene starter på nytt. En oppstartsjekk ser etter feil som allerede står (ikke på, spole, henger inne og vern). Står feilen fortsatt etter forsinkelsen, registreres den og varsles. Står feil-hjelperen allerede PÅ, varsles det ikke på nytt. «Ingen last» og «Ikke full last» har lange forsinkelser og sjekkes ikke ved oppstart; de fanges når avviket oppstår på nytt, og feil-hjelperen beholder tilstanden gjennom omstart.

**Hva bør automasjonen hete?**
«<navn på bryteren> - Robot», f.eks. «VVB XK1 (+RS52=434.002-XO01.1) - Robot», med entitets-ID med samme stamme som bryteren, f.eks. `automation.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_robot`. Feil-hjelperen heter «<navn på bryteren> Feil».

## 4. Hva slags info trengs

- Bryteren (reléutgangen) som styrer kontaktoren.
- Valgfritt: sensor for spoleeffekt og normal spoleeffekt.
- Valgfritt: sensor for lasten og normal full effekt.
- Valgfritt: binary_sensor-er for vern fra reléet (Shelly: Overcurrent, Overheating, Overvoltage, Overpowering).
- Valgfritt: én input_boolean per kontaktor som feil-hjelper.
- Scriptet `script.varsel_pushover_send_melding_webhome` hvis varsling skal brukes.

## 5. Innstillinger

**Hovedinnganger**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Utgang (kontaktor) | – | Bryteren som styrer kontaktoren |
| Navn i varsel (valgfri) | tom | Brukes i varseltittel. Tom = navnet til bryteren |
| Anlegg i varseltittel | Kontaktor | Første ord i tittelen, f.eks. «Tappevann» gir «🔔 Tappevann feil - <navn>» |
| Forventet tilstand | Alltid PÅ | «Alltid PÅ» eller «Ingen fast tilstand (styres av noe annet)» |
| Feil-hjelper (valgfri) | tom | input_boolean som slås PÅ ved feil og AV ved bekreftet OK. Anbefalt navn: «<navn på bryteren> Feil» |

**Spole (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Spole – målt effekt | tom | Sensor for effekten til kontaktorspolen |
| Spole – forventet effekt | 0 | Normal spoleeffekt (W). 0 = sjekken er av |
| Spole – laveste godkjente andel | 30 % | Feil når målt spoleeffekt er under denne andelen |
| Spole – forsinkelse før feil | 2 min | Avviket må vare sammenhengende så lenge |

**Last (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Last – målt effekt | tom | Sensor for lasten |
| Last – full effekt | 0 | Det sensoren viser når hele lasten er inne. 0 = alle lastsjekker er av |
| Ingen last – grense | 10 % | Feil når kontaktoren er PÅ og lasten er under denne andelen av full effekt |
| Ingen last – forsinkelse før feil | 60 min | Må være lengre enn normale termostatpauser |
| Ikke full last – grense | 80 % | Feil når lasten ikke har vært over denne andelen i hele perioden. 0 = av |
| Ikke full last – periode | 24 t | Hvor lenge lasten kan være under grensen |
| Henger inne – grense | 10 % | Feil når kontaktoren er AV og lasten er over denne andelen |
| Henger inne – forsinkelse før feil | 2 min | Avviket må vare sammenhengende så lenge |

**Andre sjekker og styring**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Ikke på – forsinkelse før feil | 5 min | Bare ved «Alltid PÅ» |
| Vern fra reléet (valgfri) | tom | binary_sensor-er. Feil når én er PÅ |
| Vern – forsinkelse før feil | 1 min | Avviket må vare sammenhengende så lenge |
| Slå kontaktoren PÅ igjen automatisk | false | Bare ved «Alltid PÅ». Slår PÅ når den har vært AV i «Ikke på – forsinkelse», nytt forsøk hvert 15. minutt |

**Varsling (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination (valgfri) | pushover | Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres slik at den blir sendt ulikt. |
| Pushover priority | 1 | −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd), 1 (Høy prioritet, rødt varsel, omgår stilleperiode), 2 (nødvarsel som gjentas til det bekreftes). |
| Levetid varsel (timer) | 168 | Hvor lenge skal varslet være synlig før det forsvinner? |
| Pushover priority – «Ikke full last» | 0 | Egen prioritet for «Ikke full last», som oftest betyr redusert effekt og ikke stopp |
| Tid for planlagt sjekk | 09:00 | Tidspunkt for påminnelse hvis en feil fortsatt står |
| Påminnelse på faste ukedager | true | Påminnelse hvis en feil står. Slå av når «Kontaktor - Fellesfeil varsel» sender samlet påminnelse |
| Ukedag(er) for planlagt sjekk | Onsdag | Hvilke dager påminnelsen sendes |
| Send varsel når feilen er borte | true | Krever «Feil-hjelper» |
| Send varsel ved manuell kjøring | true | Sett til true for å sende varsel når automasjonen kjøres manuelt. Sett til false for å ikke sende varsel ved manuell kjøring. |

> Levetid sendes til scriptet i timer. Scriptet regner om til sekunder, som er det Pushover bruker.

## 6. Funksjonsbeskrivelse

Automasjonen kjøres bare når noe skjer, slik at hver kjøring i sporloggen betyr noe:

| Når | Trigger |
|---|---|
| En sjekk har vært i avvik i hele forsinkelsen | `fault_not_on`, `fault_coil_low`, `fault_no_load`, `fault_not_full`, `fault_stuck_on`, `fault_protection` |
| Feil-hjelperen står PÅ, og kontaktoren har vært OK i 2 minutter | `ok_verified` |
| Hvert 15. minutt (bare når «Slå PÅ igjen automatisk» er valgt) | `retry_check` |
| Planlagt sjekk på faste ukedager | `scheduled_check` |
| Home Assistant starter (med oppstartsjekk) | `ha_start` |
| Automasjonen skrus PÅ (med oppstartsjekk) | `automation_enabled` |

**Sjekkene**

| Feil | Vilkår (må vare i hele forsinkelsen) |
|---|---|
| Ikke på | Forventet «Alltid PÅ» og kontaktoren er ikke PÅ (AV, utilgjengelig eller ukjent) |
| Spole | Kontaktoren er PÅ og spoleeffekt < forventet × laveste andel |
| Ingen last | Kontaktoren er PÅ og last < full effekt × «ingen last»-grense |
| Ikke full last | Kontaktoren er PÅ og last < full effekt × «ikke full»-grense i hele perioden, dvs. lasten har ikke vært over grensen én eneste gang |
| Henger inne | Kontaktoren er AV og last > full effekt × «henger inne»-grense |
| Vern | Én av vern-sensorene er PÅ |

En utilgjengelig målesensor gir ikke feil på spole eller last (verdien kan ikke vurderes).

**Oppstartsjekk**

En template-trigger slår ikke ut hvis avviket allerede står når triggeren settes opp (ved omstart eller når automasjonen skrus på). Derfor gjør automasjonen en egen sjekk ved `ha_start` og `automation_enabled`, når feil-hjelperen er AV:

1. Står «Ikke på», «Spole», «Henger inne» eller «Vern» i avvik nå, ventes det til avviket er borte, men maks den lengste forsinkelsen for avvikene som står (f.eks. 5 min for «Ikke på»).
2. Er avviket borte innen tiden, skjer ingenting.
3. Står det fortsatt, registreres feilen (feil-hjelper PÅ) og det sendes varsel med alle avvikene som står.

Mens oppstartsjekken venter, står andre kjøringer av automasjonen i kø.

**Bekreftet OK**

Kontaktoren er PÅ, spolen er over grensen, lasten er over «ikke full»-grensen (eller «ingen last»-grensen hvis «ikke full» er av), og ingen vern er PÅ. Ved «Ingen fast tilstand» er AV uten last også OK. Bekreftet OK brukes bare når feil-hjelperen står PÅ: den slås da AV, og det sendes varsel om at feilen er borte.

**Ved feil**

1. Feiltekst bygges ut fra hvilken sjekk som slo ut, med målt verdi og grense.
2. Feil-hjelperen slås PÅ (hvis valgt).
3. Varsel sendes. «Ikke full last» bruker egen prioritet (standard 0).

**Slå PÅ igjen automatisk (valgfri, standard av)**

Når «Ikke på» slår ut, eller ved nytt forsøk hvert 15. minutt, slås kontaktoren PÅ hvis den er AV og har vært AV minst «Ikke på – forsinkelse». Varselet sier at den er forsøkt slått PÅ og hva tilstanden ble. En utilgjengelig utgang røres ikke.

**Planlagt sjekk**

På valgte ukedager og tidspunkt (standard onsdag 09:00) sendes en påminnelse med alle feilene som står akkurat da. Står feil-hjelperen PÅ uten at noen sjekk er i avvik akkurat nå (f.eks. «ikke full last» som ikke er bekreftet OK), sendes det også en påminnelse.

## 7. Resultat

| Entitet | Hva skrives |
|---|---|
| Feil-hjelper (valgfri) | PÅ ved feil, AV ved bekreftet OK |
| Utgang | Bare når «Slå PÅ igjen automatisk» er valgt: `switch.turn_on` |

## 8. Varsling

**Feil:**

- **Tittel:** `🔔 <anlegg> feil - <navn>`
- **Ikke på:** `Kontaktoren skal alltid være PÅ, men har vært AV i minst 5 min. Sjekk at reléet svarer og ikke er slått av for hånd.`
- **Oppstartsjekk:** `Feil som fortsatt sto etter 5 min da overvåkingen startet (automasjonen ble skrudd på): Kontaktoren skal alltid være PÅ, men er AV.`
- **Spole:** `Kontaktoren er PÅ, men spoleeffekten er 0.0 (forventet ca. 1.7, grense 0.5). Kontaktoren trekker trolig ikke inn. Sjekk reléutgang, styresikring og spole.`
- **Ingen last:** `Kontaktoren er PÅ, men lasten har vært under 650 i 60 min (nå 0, full last ca. 6500). Sjekk sikring, kontaktor og last (f.eks. element eller termostat).`
- **Ikke full last:** `Lasten har ikke nådd full effekt (grense 5200, full last ca. 6500) på 24 timer. Nå: 3720. Mulig feil på en del av lasten, f.eks. ett element.`
- **Henger inne:** `Kontaktoren er AV, men det måles fortsatt last: 6480 (grense 650). Kontaktoren kan henge inne.`
- **Vern:** `Reléet melder vern: <navn på vern-sensor>. Sjekk last og kabling.`

**Påminnelse ved planlagt sjekk (kun når en feil står, og «Påminnelse på faste ukedager» er PÅ):**

- **Tittel:** `🔔 <anlegg> feil (påminnelse) - <navn>`
- **Melding:** én linje per feil som står.

**OK igjen (krever «Feil-hjelper»):**

- **Tittel:** `✅ <anlegg> OK igjen - <navn>`

**Manuell kjøring av automasjonen:**

- **Tittel:** `🔌 <anlegg> - Kontaktor overvåking (manuell kjøring)` med tilstand, måleverdier, grenser og feil som står.

## 9. Annet

- Måleverdi og forventet verdi må ha samme enhet (normalt W).
- Bruk lange forsinkelser på lastsjekkene for laster med termostat. Se på historikken og sett «Ingen last – forsinkelse» godt over den lengste normale pausen.
- Står lasten normalt AV i lange perioder (f.eks. bereder om sommeren når varmepumpa dekker alt), sett «Ikke full last – grense» til 0 eller øk perioden.
- Et relé som er utilgjengelig gir «Ikke på». Er Uptime Kuma også satt opp for reléet, kommer det varsel begge steder.
- Blueprinten styrer ikke kontaktoren (unntatt valgfri innkobling). Den kan brukes sammen med andre automasjoner som styrer samme utgang, med «Forventet tilstand» = «Ingen fast tilstand».

## 10. Avansert

### 10.1 Forutsettninger

- Home Assistant 2025.11.0 eller nyere.
- En switch-entitet for kontaktoren.
- `script.varsel_pushover_send_melding_webhome` (fra `blueprints/scripts/varsel_pushover.yaml`) hvis varsling brukes.
- Valgfritt: én input_boolean per kontaktor som «Feil-hjelper». Navn: «<navn på bryteren> Feil», ikon `mdi:bell-alert`. Gi gjerne entitets-ID samme stamme som bryteren, f.eks. `switch.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1` → `input_boolean.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_feil`.
- Navn på automasjonen: «<navn på bryteren> - Robot», entitets-ID med samme stamme, f.eks. `automation.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_robot`. Endre entitets-ID-en under innstillingene for automasjonen etter at den er lagret.

**Utrulling på mange kontaktorer:**
1. Lag feil-hjelperen og automasjonen for én kontaktor og sjekk sporloggen.
2. Lag resten, én automasjon per kontaktor, med grenser fra 10.7.
3. Skru hver automasjon av og på én gang, så oppstartsjekken kjører og feil som allerede står (f.eks. en kontaktor som er AV) blir registrert.
4. Legg feil-hjelperne og automasjonene inn i listen per tavle i status-sensorene (10.2).

### 10.2 Eksempler

**Automasjon fra blueprint (YAML), elkolbe i bereder:**
```yaml
alias: VVB XK1 (+RS52=434.002-XO01.1) - Robot
use_blueprint:
  path: surematu/kontaktor_overvaking.yaml
  input:
    output_switch: switch.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1
    notify_prefix: Tappevann
    expected_state: alltid_pa
    fault_latch: input_boolean.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_feil
    coil_sensor: sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_kontaktor_effekt
    coil_expected: 1.7
    power_sensor: sensor.tavle_rs52_rs52_434_002_xi1_vvb_xk1_effekt_kalkulert
    power_full: 6500
    protection_sensors:
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overcurrent
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overheating
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overvoltage
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overpowering
```

**Tavlestatus, antall feil og fellesfeil:**
Se [packages/kontaktor_overvaking_status_eksempel.yaml](./packages/kontaktor_overvaking_status_eksempel.yaml). Kjeden er:

```
Feil-hjelper per kontaktor + automasjonen PÅ/AV
  → Antall feil per tavle  → Status per tavle (I drift / Problem / Ikke overvåket)
  → Antall feil totalt     → Fellesfeil
  → Fellesfeil årsak       (kort tekst: hvilke kontaktorer som har feil)
```

En kontaktor teller som feil når feil-hjelperen er PÅ eller når automasjonen er AV (da overvåkes den ikke).

**Dashbord:**
Se [dashboards/kontaktor_overvaking_dashbord_eksempel.yaml](./dashboards/kontaktor_overvaking_dashbord_eksempel.yaml):

- **Oversikt:** samlet status, fellesfeil, antall kontaktorer med feil, én knapp per tavle, knapp til admin info (bare admin) og systembildene med temperaturer.
- **Tavleside:** status for tavla og ett Bubble Card per kontaktor (lyser når kontaktoren er PÅ, last og spole som underknapper, rød bjelle ved feil, robot-knapp til roboten), varmepumpe og admin-del. Alle trykk på kontaktorkortet åpner info, så det kan ikke slå kontaktoren av.
- **Admin info:** statusboks med feilinformasjon (Fellesfeil årsak) og ett Bubble Card per status-hjelper.

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| `scripts/varsel_pushover.yaml` | Sender Pushover-varslene |
| `snosmelt_styr_utgang.yaml` | Styrer og overvåker kontaktorer for snøsmelting (samme type sjekker, men med styring fra «Snøsmelt behov») |
| `varsel_enhet.yaml` | Varsler om enheter som er offline (Uptime Kuma) |
| `kontaktor_fellesfeil.yaml` | Overordnet robot: robot AV, samlet påminnelse og «Tilbake i normal drift» for hele anlegget |

### 10.4 Beregnede verdier og variabler

Automasjonen er bygget for å være enkel å etterprøve i sporloggen (Trace): hvert steg gjør én ting, og de viktigste stegene har en tabell som oppsummerer vurderingen.

| Steg | Variabel | Beskrivelse |
|---|---|---|
| 2 | `trigger_id`, `trigger_text` | Hvorfor automasjonen kjørte, som ID og i klartekst |
| 3 | `output_name`, `notify_prefix` | Navn og anlegg brukt i varsel |
| 4 | `has_not_on_check`, `has_coil`, `has_power`, `has_not_full`, `has_protection`, `protection_list` | Hvilke sjekker som er i bruk |
| 5 | `coil_limit`, `no_load_limit`, `not_full_limit`, `stuck_limit`, `ok_power_limit` | Grensene regnet ut fra forventet verdi og prosent |
| 6 | `switch_state_start`, `switch_off_minutes` | Kontaktoren da kjøringen startet, og hvor lenge den har vært ikke-PÅ |
| 7 | `auto_on_attempted` | Om den skal forsøkes slått PÅ i denne kjøringen (steg 8 gjør det) |
| 9 | `switch_state_now`, `switch_state_text`, `coil_value`, `power_value`, `protection_on` | Tilstand og måleverdier (−1 = ikke i bruk eller utilgjengelig) |
| 10 | `fault_now_*` | Hvilke feil som står akkurat nå |
| 11 | `monitor_table` | Én rad per sjekk: `sjekk`, `i_bruk`, `malt`, `grense`, `feil_na` |
| 12 | `ok_now` | Om kontaktoren er bekreftet OK akkurat nå |
| 13 | `latch_configured`, `latch_was_on`, `can_notify` | Feil-hjelper, og om varsel kan sendes |
| 14 | `fault_now_lines` | Feiltekstene for planlagt sjekk og manuell kjøring |
| 15 | `startup_check_needed`, `startup_wait_min` | Om oppstartsjekken trengs, og hvor lenge den venter |
| 16 | `wait` | Ventingen i oppstartsjekken (`wait.completed` = false betyr at feilen sto hele tiden) |
| 17 | `startup_fault`, `startup_fault_lines` | Resultatet av oppstartsjekken og avvikene som fortsatt sto |
| 18 | `fault_message`, `fault_priority` | Feiltekst og prioritet når en sjekk eller oppstartsjekken har slått ut |

Sjekkene er template-triggere med `trigger_variables` (`tv_*`), slik at vilkårene må være sanne sammenhengende i hele forsinkelsen. Selve ventetiden vises ikke i sporloggen. `trigger_text` sier hvilken sjekk som slo ut, og `monitor_table` viser verdiene i det kjøringen startet.

`ok_verified` er bare sann når feil-hjelperen står PÅ, ellers ville automasjonen kjørt hver gang lasten går opp i full effekt.

### 10.5 Feilhåndtering

| Scenario | Håndtering |
|---|---|
| Utgangen utilgjengelig | «Ikke på» etter forsinkelsen (ved «Alltid PÅ»). Slå PÅ igjen automatisk prøver ikke |
| Målesensor utilgjengelig | Ingen feil meldes for spole/last |
| Forventet verdi eller full effekt er 0 | Sjekken er av |
| Lasten faller til 0 i noen sekunder (målestøy) | Fanges av forsinkelsen |
| Omstart av Home Assistant | Forsinkelsene starter på nytt. Oppstartsjekken fanger «Ikke på», «Spole», «Henger inne» og «Vern» som står. Feil-hjelperen beholder tilstanden og nullstilles ved oppstart hvis kontaktoren er OK |
| Automasjonen lages eller skrus på mens en feil står | Oppstartsjekken (ved `automation_enabled`). En helt ny automasjon må skrus av og på én gang for at sjekken skal kjøre |
| Feil-hjelperen slås AV for hånd mens feilen står | Feilen varsles på nytt først når avviket forsvinner og kommer igjen |
| Slå PÅ feiler | Feilen logges, nytt forsøk hvert 15. minutt |

### 10.6 Varsling og debug info

Ingen egne debug-varsler. Feilsøking gjøres i sporloggen (Trace) til automasjonen. Blueprinten lagrer de 30 siste kjøringene (standard i Home Assistant er 5). Automasjonen kjører bare når noe skjer, så 30 kjøringer dekker lang tid. Kjør automasjonen manuelt for å få status tilsendt på Pushover.

| Spørsmål | Se på steg | Variabel |
|---|---|---|
| Hvorfor kjørte den nå? | 2 | `trigger_text` |
| Hva var målt, og hva var grensen? | 11 | `monitor_table` |
| Ble den slått PÅ automatisk? | 7 | `auto_on_attempted` |
| Fant oppstartsjekken feil? | 15–17 | `startup_check_needed`, `startup_fault`, `startup_fault_lines` |
| Hvorfor ble feil-hjelperen (ikke) nullstilt? | 12 og 13 | `ok_now`, `latch_was_on` |
| Hvorfor ble det (ikke) sendt varsel? | 13 og 18 | `can_notify`, `fault_priority` |

### 10.7 Slik finner du grensene

1. Åpne historikken for spole- og lastsensoren for 3–7 døgn.
2. **Spole:** les av normal verdi når kontaktoren ligger inne (f.eks. 1,7 W). Standard 30 % gir grense ca. 0,5 W.
3. **Full effekt:** bruk det høyeste nivået som nås hver dag (f.eks. 6500 W). Sjekk at det nås minst én gang per «Ikke full last – periode».
4. **Ingen last – forsinkelse:** finn lengste normale periode med 0 W mens kontaktoren er PÅ, og sett forsinkelsen minst 2–3 ganger lengre.

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/kontaktor_overvaking.yaml
- Eksempel på status-sensorer: https://github.com/surematu/WebHomeHelpFiles/blob/main/packages/kontaktor_overvaking_status_eksempel.yaml
- Eksempel på dashbord: https://github.com/surematu/WebHomeHelpFiles/blob/main/dashboards/kontaktor_overvaking_dashbord_eksempel.yaml
- Template-trigger: https://www.home-assistant.io/docs/automation/trigger/#template-trigger
- Bubble Card: https://github.com/Clooos/Bubble-Card
