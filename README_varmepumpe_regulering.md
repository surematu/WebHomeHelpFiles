# Varmepumpe (Rom) Robot – Automatisk regulering av varmepumpe-settpunkt

## 1. Formål

Denne automasjonen regulerer varmepumpe-settpunktet kontinuerlig og automatisk, basert på hvor mye varme (eller kjøling) rommet faktisk trenger.

Målet er at varmepumpen alltid leverer akkurat passe – ikke for mye og ikke for lite – slik at romtemperaturen holdes stabilt nær ønsket nivå.

Automasjonen kan i tillegg:
- Styre en panelovn som supplement til varmepumpen ved høyt varmebehov
- Bytte mellom varme og kjøling basert på årstid (krever driftsmodus-automasjonen)
- Regulere viftehastigheten på varmepumpen
- Sende debug-varsler ved endringer (av som standard)

## 2. Eksempler på bruk

- **Romtemperatur er for lav:** Romreguleringen (TRV/termostat) rapporterer 80 % pådrag. Automasjonen setter varmepumpen høyt – f.eks. 25 °C – for å varme rommet raskest mulig.
- **Romtemperatur nær settpunktet:** Pådrag er 30 %. Varmepumpen settes til et moderat nivå, og panelovnen holdes av.
- **Sommer, kjøling:** Driftsmodus er SOMMER. Automasjonen inverterer logikken – høyt kjøle-pådrag gir lavt settpunkt på varmepumpen (mer kjøling).
- **Kaldt rom med panelovn:** Pådrag er 75 %. Varmepumpen er på maks, og panelovnen slippes gradvis til som supplement.
- **Overgangssituasjon vinter:** Det er 28 °C inne og VINTER-modus. En nødoverkobling starter kjøling midlertidig.

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

**Er debug-varsler aktivert?**
Nei, debug-varsler (Pushover) er av som standard. Aktiver med innstillingen «Aktiver debug-varsling».

## 4. Hva slags info trengs

- **Rom-climate** (overordnet): climate-entitet som gir pådragssignal og settpunkt (obligatorisk)
- **Pumpe-climate** (varmepumpe): climate-entiteten som styres (obligatorisk)
- **Varme-climate** (panelovn): valgfri climate-entitet som supplement (valgfri)
- **Varme-switch** (digital utgang): valgfri switch-entitet som alternativ eller supplement til climate-panelovn (valgfri)
- **`input_select.driftsmodus_vinter_sommer`**: kreves kun om kjøling er aktivert

## 5. Innstillinger

### Varme (overordnet climate)

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pådrag – offset min | −1 °C | Offset som tilsvarer 0 % pådrag (brukes kun uten power_percent-signal) |
| Pådrag – offset maks | +1 °C | Offset som tilsvarer 100 % pådrag |
| Varme-climate (panelovn) | (tomt) | Valgfri panelovn climate-entitet som supplement ved høyt pådrag |
| Varme-switch (digital utgang) | (tomt) | Valgfri switch-entitet som alternativ eller supplement til climate-panelovn |

### Varmepumpe

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Maks endring per kjøring | 1 °C | Størst tillatt settpunkt-endring pr. kjøring (hindrer brå hopp) |
| Grader under settpunkt ved 0 % pådrag | −3 °C | Varmepumpe-settpunkt relativt til basissettpunkt ved lavt pådrag |
| Grader over settpunkt ved 100 % pådrag | +3 °C | Varmepumpe-settpunkt relativt til basissettpunkt ved høyt pådrag |

### Vifte

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Vifte boost | false | Aktiver automatisk vifteregulering basert på pådrag |

### Kjøling (valgfri funksjon)

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Aktiver kjøling | false | Aktiver sesongbasert bytte mellom varme og kjøling |
| SOMMER – hysterese kjøling av (°C) | 0,5 | Romtemp-stigning over ON-terskel før tvungen varme avsluttes |
| VINTER – hysterese kjøling av (°C) | 0,5 | Romtemp-fall over ON-terskel før tvungen kjøling avsluttes |
| SOMMER – tvungen varme-terskel (°C) | 2 | Tving varme når romtemp er mer enn X under settpunktet |
| VINTER – tvungen kjøle-terskel (°C) | 2 | Tillat kjøling som nødoverkobling når romtemp er X over settpunktet |

### Panelovn

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Panelovn pådrag-grense (%) | 60 | Under grensen: kun varmepumpe. Over: panelovn aktiveres i tillegg |
| Panelovn delta maks (°C) | 2,0 | Temperaturspenn for proporsjonal panelovn-styring (kun climate) |
| Switch – Varme (digital utgang) | (tomt) | Valgfri switch-entitet for PWM-styring i stedet for eller i tillegg til climate |
| Minimum on-tid for switch (s) | 10 | Kortere beregnet on-tid → switch holdes av (tilsvarer minimal_activation_delay i VT) |

### Varsling (debug)

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Aktiver debug-varsling | false | Aktiver Pushover-varsler ved endringer |
| Pushover destination | pushover | Mottakergruppe |
| Pushover prioritet | −1 | Prioritet for debug-varsler |
| Pushover TTL (sekunder) | 3600 | Levetid for debug-varsler |

## 6. Funksjonsbeskrivelse

Automasjonen kjøres hvert 10. minutt og ved endringer i settpunkt eller driftsmodus:

> **Merk:** Laster (panelovn/switch) kan bare skrues av og på maksimalt hvert **10. minutt**. Trenger du raskere regulering, bør en ekstern climate med egne syklustider benyttes i stedet – se [9.3](#93-panelovn-som-digital-utgang-switchpwm) og [Versatile Thermostat](https://github.com/jmcollin78/versatile_thermostat) som eksempel.

1. Leser pådragssignal fra rom-climate (power_percent → regulated_target_temperature → 50 % fallback)
2. Beregner minimumspådrag basert på temperaturunderskudd og preset (eco/comfort/boost)
3. Velger høyeste av beregnet pådrag og minimum
4. Bestemmer modus: varme eller kjøling (se kjølelogikk nedenfor)
5. Beregner settpunkt fra pådrag via en lineær kurve mellom `basis+grader_under_min` og `basis+grader_over_maks`
6. Begrenser endringen til maks ±`maks_endring_per_kjoring` fra nåværende settpunkt (ramp)
7. Runder av til heltall eller halvt grad
8. Oppdaterer varmepumpa kun hvis settpunkt eller modus faktisk endres
9. Styrer panelovnen (climate og/eller switch) proporsjonalt basert på temperaturunderskudd og pådrag (hvis konfigurert)
10. Justerer viftehastighet (hvis aktivert)

**Kjølelogikk (krever driftsmodus-automasjonen):**
- VINTER-modus: kjøler normalt ikke. Nødoverkobling slår inn ved romtemp > settpunkt + terskel.
- SOMMER-modus: kjøler normalt. Tvungen varme slår inn ved romtemp < settpunkt − terskel.

## 7. Resultat

- **Pumpe-climate** (varmepumpe): settpunkt og modus (heat/cool) oppdateres ved behov
- **Varme-climate** (panelovn): settpunkt oppdateres proporsjonalt (settes til frost-setpunkt ved ingen behov)
- **Varme-switch** (digital utgang): slås på og av med PWM basert på beregnet panelovn-pådrag
- **Rom-climate** (overordnet): hvac_mode synkroniseres med beregnet modus (aldri endret fra «off»)

## 8. Varsling

Debug-varsler er **av** som standard (`ix_pushover_varsling = false`). Aktiveres manuelt i innstillingene.

**Tittel:** (sensornavnet fra rom-climate)

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

Overordnet climate (rom_climate) oppdateres til samme modus som varmepumpen (heat/cool), men aldri dersom den er i «off»-modus.

### 9.3 Panelovn som digital utgang (switch/PWM)

Dersom en switch-entitet er konfigurert som varme-utgang, styres den med PWM (pulsbreddemodulasjon). Automasjonen kjøres med `mode: restart`, som betyr at en ny triggerhendelse avbryter pågående kjøring.

- **Effektiv PWM-periode:** 10 minutter (automasjonens kjøreintervall, `pwm_period_sec = 600 s`)
- **Beregning:** `on_time_actual = panelovn_maal_power % × 600 sekunder`
- **Eksempel (60 % pådrag):** switch på i 360 s, deretter av i 240 s per 10-minutters vindu
- **100 % pådrag:** on_time_actual = 600 s → neste 10-min trigger avbryter delay (mode:restart), `switch.turn_off` utføres aldri → switchen holdes permanent på gjennom neste kjøring
- **0 % pådrag eller kortere on-tid enn minimum (`panelovn_switch_min_on_sec`):** switchen slås umiddelbart av

**Syklustid fra Versatile Thermostat (referanse):**
`configuration.cycle_min` leses fra overordnet climate og vises som trace-variabler:
- `panelovn_switch_on_time_vt_sec` = on-tid i VT-syklusen (f.eks. 30 min × 60 % = 1080 s)
- `panelovn_switch_off_time_vt_sec` = av-tid i VT-syklusen (720 s)

Disse referanseverdiene er kun til informasjon og debug. Selve styringen bruker 10-minuttersvinduet fordi automasjonen kjøres hvert 10. minutt. Duty cycle-forholdet er identisk: 60 % pådrag gir 60 % av-/på-tid uavhengig av om man bruker VT-syklusen (30 min) eller 10-min vinduet.

Switch og climate-panelovn kan brukes **samtidig** – begge styres uavhengig med samme beregnet panelovn-pådrag.

> **Merk – reguleringstakt:** Switchen (og climate-panelovnen) justeres maksimalt hvert **10. minutt** fordi automasjonen kjøres med dette intervallet. Dersom raskere av/på-regulering er nødvendig, bør en ekstern climate med egne, kortere syklustider benyttes i stedet for switch-PWM-styringen her – f.eks. [Versatile Thermostat](https://github.com/jmcollin78/versatile_thermostat).

## 10. Avansert

### 10.1 Forutsettninger

- Rom-climate med pådragssignal (`power_percent` eller `regulated_target_temperature`)
- Varmepumpe-climate med støtte for settpunkt-justering
- For kjøling: `input_select.driftsmodus_vinter_sommer` (satt av `driftsmodus_varme_kjoling_automatisk`)
- For panelovn (climate): `preset_temperatures.frost_temp` på overordnet climate (fallback: 10 °C)
- For panelovn (switch): switch-entitet tilgjengelig i HA; syklustid (`configuration.cycle_min`) leses automatisk fra overordnet climate (fallback: 30 min)
- For debug-varsler: Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome`

### 10.2 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [driftsmodus_varme_kjoling_automatisk.yaml](./blueprints/automation/driftsmodus_varme_kjoling_automatisk.yaml) | Setter `input_select.driftsmodus_vinter_sommer` som denne automasjonen leser. Se [README_automatisk_valg_varme_kjoling.md](./README_automatisk_valg_varme_kjoling.md) |
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for debug-varsler via Pushover |

### 10.3 Beregnede verdier og variabler

Kjøretid og triggere:
- Hvert **10. minutt** (`time_pattern`)
- Ved **settpunkt-endring** på rom-climate
- Ved **driftsmodus-endring** (`input_select.driftsmodus_vinter_sommer`)
- 5 sekunder forsinkelse for å la sensorer stabilisere seg

**Pådragskilde (prioritert rekkefølge):**
1. `power_percent` fra rom-climate → brukes direkte (0–100 %)
2. `regulated_target_temperature` → lineær interpolasjon mellom `padrag_regulated_offset_min` og `padrag_regulated_offset_maks`
3. Fallback → 50 %

**Settpunkt-kurve (varme):**
`HP-settpunkt = basis + grader_under_min + (hp_norm_power / 100) × (grader_over_maks − grader_under_min)`

**Settpunkt-kurve (kjøling, invertert):**
`HP-settpunkt = basis + grader_over_maks − (pådrag / 100) × (grader_over_maks − grader_under_min)`

**Basissettpunkt:**
`max(rom_settpunkt, comfort_settpunkt)` hvis comfort-preset finnes

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

> **Eksempel VINTER** – settpunkt 22 °C, grense 3 °C, hysterese 0,5 °C:
> - Kjøling slår PÅ når romtemp > **25 °C**
> - Kjøling slår AV når romtemp faller under **24,5 °C**

> **Eksempel SOMMER** – settpunkt 22 °C, grense 3 °C, hysterese 0,5 °C:
> - Tvungen varme slår PÅ når romtemp < **19 °C**
> - Tvungen varme slår AV når romtemp > **19,5 °C**

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
| `varmepumpe_output_power` | Effektivt pådrag etter min-klipping |
| `hp_norm_power_heat` | Normalisert HP-pådrag (0–100 %, kun varme) |
| `varmepumpe_req_spk_raw` | Råberegnet varmepumpe-settpunkt |
| `qnum_varmepumpe_req_spk` | Endelig settpunkt etter ramp og avrunding |
| `onsket_mode` | Beregnet hvac-modus (`heat`/`cool`) |
| `panelovn_hp_ready` | true når varmepumpen har nådd 80 % av varmekurven |
| `panelovn_maal_power` | Panelovn mål-pådrag (0–100 %) – brukes av både climate og switch |
| `panelovn_vt_cycle_min` | Syklustid lest fra VT `configuration.cycle_min` (default 30 min) |
| `panelovn_switch_configured` | true dersom switch-entitet er konfigurert |
| `pwm_period_sec` | PWM-periode i sekunder (600 = 10 min, lik automasjonens kjøreintervall) |
| `panelovn_switch_on_time_vt_sec` | Referanse on-tid i VT-syklus (sekunder) |
| `panelovn_switch_off_time_vt_sec` | Referanse av-tid i VT-syklus (sekunder) |
| `panelovn_switch_on_time_actual_sec` | Effektiv on-tid per 10-min kjøring (sekunder) |
| `panelovn_switch_skal_aktiveres` | true dersom switch-PWM skal kjøres i denne runden |
| `drift_is_sommer` / `drift_is_vinter` | Driftsmodus-status |
| `summer_force_heat_on` / `winter_allow_cool_on` | Override-status |

### 10.4 Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| `power_percent` mangler | Beregner fra `regulated_target_temperature` eller faller tilbake til 50 % |
| `regulated_target_temperature` mangler | Bruker 50 % som standardpådrag |
| `comfort_temp` mangler | Bruker rom-settpunkt direkte som basis |
| Varmepumpa støtter ikke fan-moder | Ingen vifte-oppdatering |
| `driftsmodus_vinter_sommer` ugyldig | Varmepumpa holdes i `heat`-modus |
| Settpunkt utenfor `[pumpe_temp_min, pumpe_temp_maks]` | Klippes til absolutt grense |
| `varme_climate` ikke konfigurert | Panelovn climate-steg hoppes over |
| `varme_switch` ikke konfigurert | Panelovn switch-steg hoppes over |
| `preset_temperatures.frost_temp` mangler | Bruker 10 °C som fallback |
| Varme-climate utenfor `[min_temp, max_temp]` | Klippes til klimaets absolutte grenser |
| Overordnet climate er `off` | Overordnet oppdateres ikke; panelovn settes til frost; switch slås av |
| `panelovn_padrag_grense` = 0 | hp_norm_power settes til 100 % (unngår divisjon med null) |
| `configuration.cycle_min` mangler på overordnet climate | Bruker 30 min som fallback |
| Beregnet switch on-tid < minimum aktiveringstid | Switch holdes av (PWM-syklus hoppes over) |

### 10.5 Varsling og debug info

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
