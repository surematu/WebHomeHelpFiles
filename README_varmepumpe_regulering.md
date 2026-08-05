# Varmepumpe (Rom) Robot – Automatisk regulering av varmepumpe-settpunkt

## 1. Formål

Denne automasjonen regulerer varmepumpe-settpunktet kontinuerlig og automatisk, basert på hvor mye varme (eller kjøling) rommet faktisk trenger.

Målet er at varmepumpen alltid leverer akkurat passe – ikke for mye og ikke for lite – slik at romtemperaturen holdes stabilt nær ønsket nivå.

Automasjonen kan i tillegg:
- Styre en panelovn som supplement til varmepumpen ved høyt varmebehov
- Bytte mellom varme og kjøling basert på årstid (krever driftsmodus-automasjonen)
- Regulere viftehastigheten på varmepumpen
- Synkronisere en valgfri sekundær varmepumpe-entitet etter primær
- Sende debug-varsler ved endringer (av som standard)

## 2. Eksempler på bruk

- **Romtemperatur er for lav:** Romreguleringen (TRV/termostat) rapporterer 80 % pådrag. Automasjonen setter varmepumpen høyt – f.eks. 25 °C – for å varme rommet raskest mulig.
- **Romtemperatur nær settpunktet:** Pådrag er 30 %. Varmepumpen settes til et moderat nivå, og panelovnen holdes av.
- **Sommer, kjøling:** Driftsmodus er SOMMER. Automasjonen inverterer logikken – høyt kjøle-pådrag gir lavt settpunkt på varmepumpen (mer kjøling).
- **Kaldt rom med panelovn:** Pådrag er 75 %. Varmepumpen er på maks, og panelovnen slippes gradvis til som supplement.
- **Overgangssituasjon vinter:** Det er 28 °C inne og VINTER-modus. En nødoverkobling starter kjøling midlertidig.
- **Vifte boost:** Rommet trenger mye varme. Viften settes til `high` for å flytte mer varm luft raskere ut i rommet.

## 3. FAQ – Ofte stilte spørsmål

**Hva er «pådrag»?**
Pådrag er et signal (0–100 %) fra den overordnede romreguleringen som forteller hvor mye varme (eller kjøling) rommet trenger. 0 % betyr at rommet er varmt nok. 100 % betyr maksimalt behov.

**Hva er «settpunkt»?**
Settpunkt er temperaturen varmepumpen settes til. Høyere settpunkt = mer varme. Lavere settpunkt = mer kjøling.

**Hva er «rom-climate»?**
Det er den overordnede reguleringsenheten (f.eks. en TRV eller smart termostat) som beregner pådragssignalet. Automasjonen leser signalet derfra og setter varmepumpen deretter.

**Trenger jeg driftsmodus-automasjonen?**
Nei, kjøling er valgfri. Uten kjøling aktivert kjøres varmepumpen alltid i varmemodus. Kjøling krever at `driftsmodus_varme_kjoling_automatisk`-blueprinten er installert.

**Hva er panelovn-funksjonen?**
Panelovnen (varme-climate) er et supplement til varmepumpen. Den aktiveres gradvis når pådrag er over en terskel (standard 60 %) – men kun etter at varmepumpen faktisk har rampet opp til minst 80 % av sin kapasitet.

**Hva brukes «Temperaturspenn for panelovn 0–100 %» til?**
Den bestemmer hvor raskt climate-panelovnen skal trappes opp når rommet ligger under settpunkt. Lav verdi gjør at panelovnen reagerer raskt hvis varmepumpa bruker tid. Høy verdi gir roligere opptrapping. Den slår ikke av panelovn-funksjonen alene – for å deaktivere panelovn-styring må varme-utgangene stå tomme eller varme settes i `MANUELL`.

**Hvorfor ha både primær og sekundær varmepumpe-entitet?**
Primær brukes alltid først. Sekundær kan brukes som reserve eller når den støtter funksjoner som primær entitet ikke støtter, for eksempel enkelte viftevalg.

**Er debug-varsler aktivert?**
Nei, debug-varsler (Pushover) er av som standard. Aktiver med innstillingen «Aktiver debug-varsling».

## 4. Hva slags info trengs

- **Rom-climate** (overordnet): climate-entitet som gir pådragssignal og settpunkt (obligatorisk)
- **Input select – Varmepumpe AUTO/MANUELL**: valgfri vender for å stoppe automatisk styring av varmepumpe
- **Input select – Varme AUTO/MANUELL**: valgfri vender for å stoppe automatisk styring av varme-utganger
- **Varmepumpe-climate** (varmepumpe): climate-entiteten som styres (obligatorisk)
- **Varmepumpe-climate sekundær**: valgfri ekstra climate-entitet som synkes etter primær
- **Varmepumpe minimum settpunkt (valgfri overstyring)**: valgfri manuell nedre skrivegrense (tom = av)
- **Varmepumpe maksimum settpunkt (valgfri overstyring)**: valgfri manuell øvre skrivegrense (tom = av)
- **Varme-climate** (panelovn): valgfri climate-entitet som supplement (valgfri)
- **Utgang - Varme utgang digital (switch)**: valgfri switch-entitet som alternativ eller supplement til climate-panelovn (valgfri)
- **Utgang - Varme pådrag panelovn** (`input_number`): valgfri prosent-utgang 0–100 % for ekstern syklusstyring (valgfri)
- **`input_select.driftsmodus_vinter_sommer`**: kreves kun om kjøling er aktivert

## 5. Innstillinger

### Varme (overordnet climate + vendere)

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Klima - Overordnet styring for rom (Versatile Thermostat) | – | Overordnet climate som leverer settpunkt, romtemp og pådrag (`power_percent`) |
| Input select - Varmepumpe AUTO/MANUELL | (tomt) | Valgfri. `AUTO` (eller tom) = automasjonen styrer varmepumpe. `MANUELL` = ingen skriv til varmepumpe |
| Input select - Varme AUTO/MANUELL | (tomt) | Valgfri. `AUTO` (eller tom) = automasjonen styrer panelovn/switch/prosent-utgang. `MANUELL` = ingen skriv til varme-utganger |
| Pådrag-grense varmepumpe / panelovn (%) | 60 | Delingspunkt mellom varmepumpe og panelovn. Fra 0–60 % brukes hele pådraget på varmepumpa. Over grensen kan panelovn få resten, men først når varmepumpa faktisk har nådd minst 80 % av sin egen varmekurve |

### Varmepumpe

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Climate - Varmepumpe | – | Primær climate-entitet som automasjonen alltid styrer først |
| Climate - Varmepumpe sekundær | (tomt) | Valgfri sekundær climate-entitet som sjekkes 30 sekunder etter primær. Hvis ønsket modus, settpunkt eller vifte fortsatt mangler der, skrives endringen også til sekundær |
| Varmepumpe minimum settpunkt (valgfri overstyring) | (tomt) | Valgfri manuell minimumsgrense for settpunkt-skriving. Brukes hvis rapportert `min_temp` ikke stemmer, eller for ekstra begrensning. Effektiv minimum blir strengeste verdi: `max(rapportert min_temp, manuell minimum)` |
| Varmepumpe maksimum settpunkt (valgfri overstyring) | (tomt) | Valgfri manuell maksimumsgrense for settpunkt-skriving. Brukes hvis rapportert `max_temp` ikke stemmer, eller for ekstra begrensning. Effektiv maksimum blir strengeste verdi: `min(rapportert max_temp, manuell maksimum)` |
| Maks endring per kjøring | 1 °C | Størst tillatt settpunkt-endring pr. kjøring (hindrer brå hopp) |
| Grader under settpunkt ved 0 % pådrag | −4 °C | Varmepumpe-settpunkt relativt til basissettpunkt ved lavt pådrag |
| Grader over settpunkt ved 100 % pådrag | +3 °C | Varmepumpe-settpunkt relativt til basissettpunkt ved høyt pådrag |

### Vifte

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Vifte boost | false | Aktiver automatisk vifteregulering når varmepumpa trenger hjelp til å flytte mer luft. Eksempel: frost-preset eller høyt pådrag kan gi `high`, mens lavt pådrag kan gi `medium` |

### Kjøling (valgfri funksjon)

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Aktiver kjøling | false | Aktiver sesongbasert bytte mellom varme og kjøling |
| SOMMER – hysterese kjøling av (°C) | 1 | Romtemp-stigning over ON-terskel før tvungen varme avsluttes |
| VINTER – hysterese kjøling av (°C) | 1 | Romtemp-fall over ON-terskel før tvungen kjøling avsluttes |
| SOMMER – tvungen varme-terskel (°C) | 2 | Tving varme når romtemp er mer enn X under settpunktet |
| VINTER – tvungen kjøle-terskel (°C) | 2 | Tillat kjøling som nødoverkobling når romtemp er X over settpunktet |

### Panelovn

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Climate - Varme | (tomt) | Valgfri panelovn climate-entitet som supplement ved høyt pådrag |
| Temperaturspenn for panelovn 0–100 % (°C) | 2,0 | Hvor mange grader under settpunkt som skal til før climate-panelovnen er på 100 %. Lav verdi = rask og aggressiv hjelp hvis varmepumpa er treg. Høy verdi = roligere opptrapping. Dette er ikke en av/på-bryter for panelovn-funksjonen |
| Utgang - Varme utgang digital (switch) | (tomt) | Valgfri switch-entitet for fast trinnstyring i stedet for eller i tillegg til climate |
| Utgang - Varme pådrag panelovn (input_number) | (tomt) | Valgfri prosent-utgang (0–100 %) for ekstern styring med egen syklustid |

### Varsling (debug)

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Aktiver debug-varsling | false | Aktiver Pushover-varsler ved endringer |
| Send varsling ved manuell kjøring | false | Sender alltid Pushover ved manuell kjøring når aktivert, også uten vanlige endringer |
| Pushover destination | pushover | Mottakergruppe |
| Pushover prioritet | −1 | Prioritet for debug-varsler |
| Pushover TTL (sekunder) | 21600 | Levetid for debug-varsler |

## 6. Funksjonsbeskrivelse

Automasjonen kjøres hvert 10. minutt og ved endringer i settpunkt eller driftsmodus:

> **Merk:** Laster (panelovn/switch) vurderes hvert **10. minutt**. Switch følger samtidig en fast **30-minutters syklus** (3 slot à 10 min) som er låst til klokkeslett (veggklokke), ikke til tidspunktet panelovn blir aktiv. Trenger du annen syklustid, bruk prosent-utgangen i [9.4](#94-panelovn-prosent-utgang-alternativ-til-switch) og styr syklusen eksternt.
> Slot-grensene ligger fast på klokkeslett (:00, :10, :20, :30, :40, :50). Hvis panelovn blir aktiv midt i en slot, kan første slot bli kortere/lengre før normal rytme fortsetter ved neste slot-grense.
> Eksempel: blir panelovn aktiv kl. 10:07, varer første slot bare til 10:10 før vanlig 10-min rytme tar over.

1. Leser AUTO/MANUELL-vendere (tomt tolkes som AUTO)
2. Leser pådragssignal fra rom-climate (`power_percent`, ellers 50 % fallback)
3. Klipper beregnet pådrag til gyldig område (0–100 %)
4. Bestemmer modus: varme eller kjøling (se kjølelogikk nedenfor)
5. Beregner settpunkt fra pådrag via en lineær kurve mellom `basis+grader_under_min` og `basis+grader_over_maks`
6. Begrenser med effektive skrivegrenser (strammeste kombinasjon av rapportert `min_temp/max_temp` og eventuelle manuelle overstyringer)
7. Begrenser endringen til maks ±`maks_endring_per_kjoring` fra nåværende settpunkt (ramp)
8. Runder av til heltall eller halvt grad
9. Oppdaterer varmepumpa kun hvis settpunkt eller modus faktisk endres, og kun når varmepumpe-vender står i AUTO. Hvis varmepumpa er `unknown` eller `unavailable`, hoppes all skriving til varmepumpa og tilhørende debug-varsel over, men en valgfri manuell kjøring kan fortsatt sende eget Pushover-varsel som sier at varmepumpa er utilgjengelig. **Ved bytte mellom varme og kjøling skrives settpunktet ikke samme kjøring – modus får sette seg først.**
10. Styrer panelovnen (climate og/eller switch) proporsjonalt basert på temperaturunderskudd og pådrag (hvis konfigurert), og kun når varme-vender står i AUTO
11. Justerer viftehastighet (hvis aktivert og varmepumpe-vender står i AUTO)
12. Hvis sekundær varmepumpe-entitet er satt, sjekkes den 30 sekunder etterpå og manglende modus/settpunkt/vifte skrives dit også

**Kjølelogikk (krever driftsmodus-automasjonen):**
- VINTER-modus: kjøler normalt ikke. Nødoverkobling slår inn ved romtemp > settpunkt + terskel.
- SOMMER-modus: kjøler normalt. Tvungen varme slår inn ved romtemp < settpunkt − terskel.

### 6.1 Vifte boost

Formålet er å hjelpe varmepumpa med å flytte varme raskere ut i rommet når behovet er stort.

- **Frost-preset:** vifte settes til `high`
- **Pådrag 0–30 %:** vifte settes til `medium`
- **Pådrag over 50 %:** vifte settes til `high`
- **Mellom 31 og 50 %:** vifte beholdes uendret

Eksempel: Hvis rommet er mye kaldere enn ønsket og pådraget blir 80 %, økes viften til `high` for å spre varmen raskere.

## 7. Resultat

- **Varmepumpe-climate** (varmepumpe): settpunkt og modus (heat/cool) oppdateres ved behov når varmepumpe-vender er `AUTO` og entiteten er tilgjengelig. Ved bytte mellom varme og kjøling skrives **kun modus** – settpunktet holdes til neste kjøring.
- **Varmepumpe-climate sekundær** (valgfri): sjekkes 30 sekunder etter primær og får manglende modus/settpunkt/vifte skrevet ved behov når sekundær entitet er tilgjengelig, også hvis primær er utilgjengelig
- **Varme-climate** (panelovn): settpunkt oppdateres proporsjonalt når varme-vender er `AUTO`
- **Utgang - Varme utgang digital (switch)**: styres i fast 30-min trinnsyklus når varme-vender er `AUTO`
- **Utgang - Varme pådrag panelovn** (`input_number`, valgfri): oppdateres med panelovn-pådrag 0–100 % når varme-vender er `AUTO`
- **Rom-climate** (overordnet): hvac_mode synkroniseres med beregnet modus (heat/cool) – og settes aktivt til heat/cool om den er i «off» – når varmepumpe-vender er `AUTO`

## 8. Varsling

Debug-varsler er **av** som standard (`ix_pushover_varsling = false`). Aktiveres manuelt i innstillingene.

Hvis `Send varsling ved manuell kjøring` er aktivert, sendes det alltid Pushover når automasjonen startes manuelt. Hvis varmepumpa da er `unknown` eller `unavailable`, beskriver meldingen tydelig at varmepumpa er utilgjengelig i stedet for å vise en misvisende settpunkt-endring.

**Tittel:** `🌡️ <navn fra varmepumpe-climate> – <status/settpunkt>`

Eksempel: `🌡️ Varmepumpe (Stue) – 22°C`

**Eksempel på debug-melding (varme):**
> Pådrag: 72 % (varme) | Rom: 20,5 °C → 22 °C
> Varmepumpe: 22 °C → 24 °C (kurve 19–25 °C)
> Panelovn: 18 °C (pådrag 50 %)

**Eksempel på debug-melding (kjøling):**
> Pådrag: 65 % (kjøling) | Rom: 26 °C → 24 °C
> Varmepumpe (kjøl): 26 °C → 23 °C (invertert kurve)
> Varme: Av

## 9. Annet

### 9.1 Panelovn som supplement

Panelovnen holdes på frost-settpunkt (inaktiv) inntil:
1. Samlet pådrag er over panelovn-grensen (standard 60 %)
2. **Og** varmepumpen faktisk har rampet opp til minst 80 % av sin varmekurve

Dette sikrer at varmepumpen får tid til å «komme opp i fart» før panelovnen slås på.

### 9.2 Modus-endring

Overordnet climate (rom_climate) oppdateres alltid til beregnet modus (heat/cool) – også hvis den er i «off»-modus. Den settes aldri til «off». Trenger systemet minimalt pådrag, beholder den aktiv modus mens varmepumpen reguleres ned mot frost-settpunktet.
Dette skjer kun når `Input select - Varmepumpe AUTO/MANUELL` står i `AUTO`.

### 9.3 Panelovn som digital utgang (switch)

Dersom en switch-entitet er konfigurert som varme-utgang, styres den i fast 30-minutters trinnsyklus med 10-minutters slot.

- **Under 30 % pådrag:** switch av
- **30–59 % pådrag:** switch på 10 min / av 20 min (1 av 3 slot)
- **60–89 % pådrag:** switch på 20 min / av 10 min (2 av 3 slot)
- **90–100 % pådrag:** switch på hele tiden (3 av 3 slot)

Switch og climate-panelovn kan brukes **samtidig** – begge styres uavhengig med samme beregnet panelovn-pådrag.

### 9.4 Panelovn prosent-utgang (alternativ til switch)

Hvis `Utgang - Varme pådrag panelovn (input_number)` er satt, skriver automasjonen beregnet panelovn-pådrag (0–100 %) til denne entiteten.

Dette kan brukes i stedet for switch-utgangen når du ønsker egen syklustid i annen automasjon/integrasjon.
Eksempel: bruk verdien i en egen automasjon som slår et relé av/på med ønsket sykluslengde.

### 9.5 Primær og sekundær varmepumpe-entitet

Primær varmepumpe-entitet brukes alltid først. Hvis sekundær er satt, kontrollerer automasjonen 30 sekunder senere om sekundær fortsatt mangler ønsket modus, settpunkt eller vifte, og skriver endringen dit også.

Dette er nyttig når primær entitet er best til rask og lokal styring, mens sekundær kan være nyttig som reserve eller støtte andre funksjoner. I mange oppsett er primær lokal og sekundær online/cloud-basert, men automasjonen krever bare at du velger en primær og eventuelt en sekundær. Støttede funksjoner kan variere mellom entitetene, så sekundær kan noen ganger håndtere viftevalg eller andre felt som primær ikke tilbyr.

## 10. Avansert

### 10.1 Forutsettninger

- Rom-climate med pådragssignal (`power_percent`)
- Varmepumpe-climate med støtte for settpunkt-justering
- Sekundær varmepumpe-climate er valgfri, men bør peke til samme fysiske varmepumpe som primær hvis den brukes
- For kjøling: `input_select.driftsmodus_vinter_sommer` (satt av `driftsmodus_varme_kjoling_automatisk`)
- For panelovn (climate): `preset_temperatures.frost_temp` på overordnet climate (fallback: 10 °C)
- For panelovn (switch): switch-entitet tilgjengelig i HA
- For debug-varsler: Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome`

### 10.2 Eksempler

**AUTO/MANUELL-vendere (`input_select`):**

```yaml
input_select:
  stue_panelovn_stue_auto_manuell:
    name: Panelovn (Stue) Auto/Manuell
    options:
      - AUTO
      - MANUELL
    initial: AUTO
    icon: mdi:heat-pump

  stue_varmepumpe_stue_auto_manuell:
    name: Varmepumpe (Stue) Auto/Manuell
    options:
      - AUTO
      - MANUELL
    initial: AUTO
    icon: mdi:radiator
```

Bruk disse to entitetene i blueprint-inputene:
- `Input select - Varmepumpe AUTO/MANUELL`
- `Input select - Varme AUTO/MANUELL`

Hvis inputene ikke settes (tomt), behandles det som `AUTO`.

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [driftsmodus_varme_kjoling_automatisk.yaml](./blueprints/automation/driftsmodus_varme_kjoling_automatisk.yaml) | Setter `input_select.driftsmodus_vinter_sommer` som denne automasjonen leser. Se [README_automatisk_valg_varme_kjoling.md](./README_automatisk_valg_varme_kjoling.md) |
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for debug-varsler via Pushover |

### 10.4 Beregnede verdier og variabler

Kjøretid og triggere:
- Hvert **10. minutt** (`time_pattern`)
- Ved **settpunkt-endring** på rom-climate
- Ved **driftsmodus-endring** (`input_select.driftsmodus_vinter_sommer`)
- 5 sekunder forsinkelse for å la sensorer stabilisere seg
- Ved sekundær varmepumpe-entitet: ytterligere 30 sekunder forsinket synk etter primær ved behov

**Pådragskilde (prioritert rekkefølge):**
1. `power_percent` fra rom-climate → brukes direkte (0–100 %)
2. Fallback → 50 %

**Settpunkt-kurve (varme):**
`HP-settpunkt = basis + grader_under_min + (hp_norm_power / 100) × (grader_over_maks − grader_under_min)`

**Settpunkt-kurve (kjøling, invertert):**
`HP-settpunkt = basis + grader_over_maks − (pådrag / 100) × (grader_over_maks − grader_under_min)`

**Basissettpunkt:**
`max(rom_settpunkt, comfort_settpunkt)` hvis comfort-preset finnes

**Effektive skrivegrenser for varmepumpe-settpunkt:**
- `effektiv_min = max(rapportert min_temp, manuell minimum hvis satt)`
- `effektiv_maks = min(rapportert max_temp, manuell maksimum hvis satt)`
- Tomme manuelle felt ignoreres.

**Normalisering av pådrag for varmepumpe vs. panelovn:**
- Varmepumpe (varme): pådrag 0–`panelovn_padrag_grense`% normaliseres til 0–100 % for HP-kurven
- Panelovn: pådrag fra grensen til 100 % normaliseres til 0–100 % panelovn-mål

**Kjølelogikk – oversikt:**

VINTER (default = heat):

| Tilstand | Resultat |
|---|---|
| Settpunkt < comfort-settpunkt | `heat` (kjøling sperret) |
| Romtemp > settpunkt + `inum_kjoling_vinter_varmt_grense` | `cool` (override PÅ) |
| Aktiv kjøle-override og romtemp > (settpunkt + grense) − hysterese | `cool` (override holdes) |
| Ellers | `heat` (override AV) |

SOMMER (default = cool):

| Tilstand | Resultat |
|---|---|
| Settpunkt < comfort-settpunkt | `heat` (kjøling sperret) |
| Romtemp < settpunkt − `inum_kjoling_sommer_kaldt_grense` | `heat` (override PÅ) |
| Aktiv varme-override og romtemp < (settpunkt − grense) + hysterese | `heat` (override holdes) |
| Ellers | `cool` (override AV) |

> **Eksempel VINTER** – settpunkt 22 °C, grense 3 °C, hysterese 1 °C:
> - Kjøling slår PÅ når romtemp > **25 °C**
> - Kjøling slår AV når romtemp faller under **24 °C**

> **Eksempel SOMMER** – settpunkt 22 °C, grense 3 °C, hysterese 1 °C:
> - Tvungen varme slår PÅ når romtemp < **19 °C**
> - Tvungen varme slår AV når romtemp > **20 °C**

**Panelovn-proporsjonal-styring:**
`prop = min(1, max(0, (settpunkt − romtemp) / panelovn_delta_maks))`

Panelovn-settpunkt = `frost + (settpunkt − frost) × prop`

- prop = 0: romtemp ≥ settpunkt → frost-settpunkt (inaktiv)
- prop = 1: romtemp ≥ `panelovn_delta_maks` under settpunkt → fullt settpunkt

**Viftelogikk (krever `vifte_boost = true`):**

| Tilstand | Vifte |
|---|---|
| Preset frost | `high` |
| Pådrag ≤ 30 % | `medium` |
| Pådrag > 50 % | `high` |
| Ellers | uendret |

**Sentrale trace-variabler (synlig i HA trace-viewer):**

| Variabel | Beskrivelse |
|---|---|
| `varmepumpe_output_power` | Effektivt pådrag etter klipping til 0–100 % |
| `hp_norm_power_heat` | Normalisert HP-pådrag (0–100 %, kun varme) |
| `varmepumpe_req_spk_raw` | Råberegnet varmepumpe-settpunkt |
| `qnum_varmepumpe_req_spk` | Endelig settpunkt etter ramp og avrunding |
| `onsket_mode` | Beregnet hvac-modus (`heat`/`cool`) |
| `varmepumpe_primaer_endret` | true når primær varmepumpe fikk endret settpunkt, modus eller vifte |
| `panelovn_hp_ready` | true når varmepumpen har nådd 80 % av varmekurven |
| `panelovn_maal_power` | Panelovn mål-pådrag (0–100 %) – brukes av både climate og switch |
| `panelovn_switch_configured` | true dersom switch-entitet er konfigurert |
| `panelovn_switch_on_slots` | Antall slot switch skal være på i 30-min syklus (0–3) |
| `panelovn_switch_slot_index` | Aktiv slot i syklusen (0,1,2) |
| `panelovn_switch_skal_aktiveres` | true dersom switch skal være på i nåværende slot |
| `panelovn_prosent_output_configured` | true dersom prosent-utgang (`input_number`) er konfigurert |
| `panelovn_prosent_output_onsket` | Beregnet prosent som skrives til valgfri prosent-utgang |
| `varmepumpe_sekundar_spk_update_needed` / `varmepumpe_sekundar_mode_update_needed` / `varmepumpe_sekundar_vifte_update_needed` | Viser hva som fortsatt må synkes til sekundær varmepumpe etter forsinkelsen |
| `drift_is_sommer` / `drift_is_vinter` | Driftsmodus-status |
| `summer_force_heat_on` / `winter_allow_cool_on` | Override-status |

### 10.5 Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| `power_percent` mangler | Bruker 50 % som standardpådrag |
| `comfort_temp` mangler | Bruker rom-settpunkt direkte som basis |
| Varmepumpa støtter ikke fan-moder | Ingen vifte-oppdatering |
| `driftsmodus_vinter_sommer` ugyldig | Varmepumpa holdes i `heat`-modus |
| Settpunkt utenfor varmepumpas `[min_temp, max_temp]` | Klippes til grensene fra varmepumpas egne attributter |
| `varme_climate` ikke konfigurert | Panelovn climate-steg hoppes over |
| `varme_switch` ikke konfigurert | Panelovn switch-steg hoppes over |
| Sekundær varmepumpe ikke konfigurert | Sekundær synk-steg hoppes over |
| `preset_temperatures.frost_temp` mangler | Bruker 10 °C som fallback |
| Varme-climate utenfor `[min_temp, max_temp]` | Klippes til climate-entityens absolutte grenser |
| Overordnet climate er `off` | Overordnet oppdateres ikke; panelovn settes til frost; switch slås av |
| `panelovn_padrag_grense` er ugyldig eller ≤ 0 | hp_norm_power settes til 100 % (unngår divisjon med null) |

### 10.6 Varsling og debug info

Debug-varsler aktiveres med `ix_pushover_varsling = true`. Sendes kun ved faktisk endring.

**Meldingen inneholder:**
- Pådrag (%) og modus (kjøling/varme)
- Info om modusendring hvis aktuelt
- Romtemperatur og settpunkt
- Varmepumpe-seksjon (settpunkt nå → ønsket, pådrag med settpunkt-range)
- Varme/panelovn-seksjon (settpunkt og pådrag)
- Vifte-endring (hvis aktuelt)

Alle sentrale mellomverdier er synlige i Home Assistant **trace-viewer** for enkel feilsøking (se liste i 10.3).

## 11. Dokumentasjon

- Blueprint-beskrivelsen lenker til denne README-filen:
  https://github.com/surematu/WebHomeHelpFiles/blob/main/README_varmepumpe_regulering.md
- Når blueprinten justeres, skal denne README-filen kontrolleres og oppdateres ved behov.
- Relatert blueprint: `driftsmodus_varme_kjoling_automatisk` setter `input_select.driftsmodus_vinter_sommer`.
  Dokumentasjon: [README_automatisk_valg_varme_kjoling.md](./README_automatisk_valg_varme_kjoling.md)
