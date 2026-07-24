# Funksjonsbeskrivelse – Varmepumpe (Rom) Robot

## 1) Formål

Denne funksjonen regulerer settpunktet på en varmepumpe kontinuerlig basert på pådragsnivået i et tilknyttet rom-climate.

Målet er at varmepumpen alltid leverer akkurat passe mye – ikke for mye og ikke for lite – slik at romtemperaturen holdes stabilt nær settpunktet uten at pumpen overstyrer.

Funksjonen støtter i tillegg:
- Sesongbasert styring via driftsmodus (VINTER/SOMMER), inkludert nødoverkobling av kjøling/varme ved ekstreme romtemperaturer.
- Valgfri vifteregulering (boost ved høyt pådrag).
- Minimum-pådrag basert på temperaturunderskudd og rom-preset (eco/comfort/boost).
- Prioritert varme-logikk: varmepumpe dekker 0–60 % av pådrag, panelovn (varme-climate) brukes som proporsjonal supplement ved høyt underskudd.
- Invertert kjøle-settpunkt: høyt kjøle-pådrag gir lavt settpunkt (mer kjøling), ikke høyt.
- Valgfri Pushover-debug-varsling (av som standard).

## 2) Kjøretid

- Kjøring: hvert **10. minutt** (via `time_pattern`)
- Kjøring: ved **endring av settpunkt** på rom-climate (`state` trigger på `temperature`-attributt)
- Kjøring: ved **endring av driftsmodus** (`state` trigger på `input_select.driftsmodus_vinter_sommer`)
- 5 sekunder forsinkelse etter utløser for å la sensorer stabilisere seg

## 3) Forventede entiteter

Blueprinten konfigureres med to obligatoriske og én valgfri climate-entitet:

| Entitet (input) | Beskrivelse |
|---|---|
| `climate` (rom_climate) | Overordnet climate som gir pådragssignal og settpunkt |
| `climate` (pumpe_climate) | Varmepumpe-climate som styres av automasjonen |
| `climate` (varme_climate) | Valgfri. Panelovn/varme-climate som aktiveres som supplement ved høyt pådrag og varme-modus |

Varmepumpe-reguleringen bruker alltid følgende entitet for sesongbasert styring (krever at kjøling er aktivert):

| Entitet | Beskrivelse |
|---|---|
| `input_select.driftsmodus_vinter_sommer` | Driftsmodus-helper med valgene VINTER og SOMMER |

## 4) Inngangsparametere

### 4.1 Varme (overordnet climate)

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `padrag_regulated_offset_min` | −1 °C | Offset relativt til settpunkt som tilsvarer 0 % pådrag (brukes kun når `regulated_target_temperature` finnes og `power_percent` mangler) |
| `padrag_regulated_offset_maks` | +1 °C | Offset relativt til settpunkt som tilsvarer 100 % pådrag |
| `varme_climate` | – | Valgfri panelovn/varme-climate. Settpunkt skaleres proporsjonalt basert på temperaturunderskudd (se avsnitt 9). Frost-settpunkt leses automatisk fra `preset_temperatures.frost_temp` på overordnet climate |

### 4.2 Varmepumpe

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `maks_endring_per_kjoring` | 1 °C | Maks endring av varmepumpe-settpunkt per kjøring (ramp-begrensning) |
| `grader_under_min` | −3 °C | Varmepumpe-settpunkt ved 0 % pådrag relativt til basissettpunkt |
| `grader_over_maks` | +3 °C | Varmepumpe-settpunkt ved 100 % pådrag relativt til basissettpunkt |

### 4.3 Varmepumpe (avansert)

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `min_padrag_eco` | 0 % | Minimum pådrag ved preset eco |
| `min_padrag_comfort` | 0 % | Minimum pådrag ved preset comfort |
| `min_padrag_boost` | 0 % | Minimum pådrag ved preset boost |
| `pumpe_temp_min` | 10 °C | Absolutt minimum temperatur på varmepumpe |
| `pumpe_temp_maks` | 29 °C | Absolutt maksimum temperatur på varmepumpe |
| `faktor_min_padrag` | 50 | Multiplikator for min-pådrag ved temperaturunderskudd |

### 4.4 Vifte

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `vifte_boost` | false | false = ingen vifteregulering; true = automatisk vifteregulering basert på pådrag |

### 4.5 Kjøling

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `ix_kjoling_aktiv` | false | Aktiver kjøling for automatisk bytte mellom heat og cool |
| `inum_kjoling_av_delta_sommer` | 0.5 °C | SOMMER: hysterese for å slå av tvungen varme-override – regnes fra terskelen som slo override PÅ |
| `inum_kjoling_av_delta_vinter` | 0.5 °C | VINTER: hysterese for å slå av tvungen kjøle-override – regnes fra terskelen som slo override PÅ |
| `inum_kjoling_sommer_kaldt_grense` | 2 °C | SOMMER: tving heat når romtemp er mer enn denne verdien under settpunkt |
| `inum_kjoling_vinter_varmt_grense` | 2 °C | VINTER: tillat cool som nødoverkobling når romtemp er mer enn denne verdien over settpunkt |

### 4.6 Panelovn

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `panelovn_padrag_grense` | 60 % | Pådrag-terskel: under grensen → kun varmepumpe. Over grensen → panelovn aktiveres i tillegg (krever varme-climate). |
| `panelovn_delta_maks` | 2.0 °C | Temperaturspenn for proporsjonal panelovn-styring. Romtemp ≥ settpunkt → 0 % (frost). Romtemp ≥ dette spennet under settpunkt → 100 %. Lineær interpolasjon i mellom. |

### 4.7 Varsling (debug)

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `ix_pushover_varsling` | false | Aktiver debug-varsling via Pushover ved endringer |
| `pushover_destination` | pushover | Mottakergruppe i `script.varsel_pushover_send_melding_webhome` |
| `pushover_priority` | −1 | Pushover-prioritet |
| `pushover_ttl` | 604800 | Pushover TTL i sekunder |

## 5) Beregningslogikk

### 5.1 Pådragskilde (Steg 2)

Pådragssignalet beregnes slik (prioritert rekkefølge):

1. **`power_percent`** finnes på rom-climate → brukes direkte (0–100 %)
2. **`regulated_target_temperature`** finnes → lineær interpolasjon mellom `padrag_regulated_offset_min` (= 0 %) og `padrag_regulated_offset_maks` (= 100 %)
3. **Fallback** → 50 % brukes som standard

### 5.2 Minimum-pådrag (Steg 3)

To separate minimums beregnes og det høyeste vinner:

- **Temperaturbasert minimum**: `(settpunkt - romtemperatur) × faktor_min_padrag`, klippet til 0–100.
  Sikrer at varmepumpa ikke girer ned når rommet ligger under settpunktet.
- **Preset-basert minimum**: `min_padrag_eco`, `min_padrag_comfort` eller `min_padrag_boost` avhengig av aktivt preset.

Effektivt pådrag = `max(beregnet_pådrag, temp_minimum, preset_minimum)`, klippet til 100.

### 5.3 Normalisering av pådrag (Steg 5)

Etter at effektivt pådrag er beregnet deles det opp i to kanaler:

**Varmepumpe (varme-modus):**  
Pådrag 0–`panelovn_padrag_grense`% normaliseres til 0–100 % for varmepumpe-settpunkt-kurven.  
Eksempel med grense = 60 %:
- Pådrag 0 % → normalisert 0 % (minst mulig HP-output)
- Pådrag 30 % → normalisert 50 %
- Pådrag 60 % → normalisert 100 % (max HP-output)

**Panelovn:**  
Pådrag fra grensen til 100 % normaliseres til 0–100 % panelovn-mål.  
Eksempel med grense = 60 %:
- Pådrag 60 % → panelovn-mål 0 %
- Pådrag 80 % → panelovn-mål 50 %
- Pådrag 100 % → panelovn-mål 100 %

Panelovn-målet er alltid 0 ved kjøling eller når varme-climate ikke er konfigurert.

**Kjøling:**  
Ved kjøling brukes pådrag direkte (0–100 %) men med invertert formel (se 5.4).

### 5.4 Settpunkt-kurve (Steg 6)

Basissettpunkt = `max(rom_settpunkt, comfort_temp)` (dersom comfort-preset finnes).

**Ved varme (heat):**  
Bruker normalisert HP-pådrag (0–100 %, fra 0–grense% av effektivt pådrag).

`HP-settpunkt = basis + grader_under_min + (hp_norm_power / 100) × (grader_over_maks − grader_under_min)`

- Ved 0 % normalisert: `basis + grader_under_min` (typisk basis − 3 °C)
- Ved 100 % normalisert: `basis + grader_over_maks` (typisk basis + 3 °C)

**Ved kjøling (cool):**  
Invertert kurve – høyt pådrag gir lavt settpunkt (mer kjøling).

`HP-settpunkt = basis + grader_over_maks − (pådrag / 100) × (grader_over_maks − grader_under_min)`

- Ved 0 % pådrag: `basis + grader_over_maks` (typisk basis + 3 °C → minimal kjøling)
- Ved 100 % pådrag: `basis + grader_under_min` (typisk basis − 3 °C → maks kjøling)

Råverdien klippes deretter til `[pumpe_temp_min, pumpe_temp_maks]`.

### 5.5 Ramp-begrensning og avrunding (Steg 6, forts.)

For å unngå brå hopp begrenses endringen til `±maks_endring_per_kjoring` fra gjeldende varmepumpe-settpunkt.

Avrunding:
- Heltall-steg (1, 2, 3, …): settpunkt avrundes til nærmeste heltall
- Halvt steg (0.5, 1.5, 2.5, …): halvgrads-verdier tillates (f.eks. 22.5 °C)

## 6) Kjøling og driftsmodus (Steg 4)

> **Merk:** Modus-bestemmelse er flyttet til Steg 4 (før settpunkt-beregning) slik at kjøle-inversjon kan beregnes korrekt.

### 6.1 Uten kjøling aktivert

Varmepumpa kjøres alltid i `heat`-modus. Ingen modusbytte utføres. Overordnet climate oppdateres til `heat` dersom den ikke allerede er i `heat` (men aldri fra `off`).

### 6.2 Kjøling aktivert – driftsmodus ugyldig verdi (fallback)

Hvis `input_select.driftsmodus_vinter_sommer` ikke har verdi VINTER eller SOMMER (f.eks. unavailable), holdes varmepumpa i `heat`-modus inntil driftsmodus igjen er tilgjengelig.

### 6.3 Kjøling aktivert – med driftsmodus (VINTER / SOMMER)

Bruker alltid `input_select.driftsmodus_vinter_sommer` (sett av `driftsmodus_varme_kjoling_automatisk`-blueprinten) for sesongbasert styring med tydelig default + override:

- **SOMMER default:** `cool`
- **VINTER default:** `heat`

Override aktiveres kun ved store avvik, og separate hystereseverdier brukes for å slå override av igjen:
- **SOMMER:** `inum_kjoling_av_delta_sommer` – hysterese for å avslutte tvungen varme
- **VINTER:** `inum_kjoling_av_delta_vinter` – hysterese for å avslutte tvungen kjøling

#### SOMMER (default = kjøling)

| Tilstand | Resultat |
|---|---|
| Settpunkt < comfort-settpunkt | `heat` (kjøling sperret) |
| Romtemp < settpunkt − `inum_kjoling_sommer_kaldt_grense` | `heat` (override PÅ: tvungen varme) |
| Aktiv tvungen varme og romtemp < (settpunkt − `inum_kjoling_sommer_kaldt_grense`) + `inum_kjoling_av_delta_sommer` | `heat` (override holdes aktiv) |
| Ellers | `cool` (override AV, tilbake til default) |

#### VINTER (default = varme)

| Tilstand | Resultat |
|---|---|
| Settpunkt < comfort-settpunkt | `heat` (kjøling sperret) |
| Romtemp > settpunkt + `inum_kjoling_vinter_varmt_grense` | `cool` (override PÅ: tvungen kjøling) |
| Aktiv tvungen kjøling og romtemp > (settpunkt + `inum_kjoling_vinter_varmt_grense`) − `inum_kjoling_av_delta_vinter` | `cool` (override holdes aktiv) |
| Ellers | `heat` (override AV, tilbake til default) |

Tanken bak oppsettet er at driftsmodus bestemmer normal retning, mens dedikerte terskler (`inum_kjoling_sommer_kaldt_grense` og `inum_kjoling_vinter_varmt_grense`) avgjør når override skal slå inn. Separate hystereseverdier (`inum_kjoling_av_delta_sommer` og `inum_kjoling_av_delta_vinter`) brukes kun for å avslutte override stabilt, slik at modus ikke flapper rundt tersklene.

> **Viktig:** Hysteresen regnes alltid fra terskelen som slo overriden PÅ – ikke fra settpunktet.
>
> **VINTER-eksempel** – settpunkt 22°C, `inum_kjoling_vinter_varmt_grense` = 3°C, hysterese = 0.5°C:
> - Kjøling slår seg PÅ når romtemp stiger over **22 + 3 = 25°C**
> - Kjøling slår seg AV igjen når romtemp faller under **25 − 0.5 = 24.5°C**
> - Med hysterese = 2°C ville kjøling slå seg av ved **25 − 2 = 23°C**
>
> **SOMMER-eksempel** – settpunkt 22°C, `inum_kjoling_sommer_kaldt_grense` = 3°C, hysterese = 0.5°C:
> - Tvungen varme slår seg PÅ når romtemp faller under **22 − 3 = 19°C**
> - Tvungen varme slår seg AV igjen når romtemp stiger over **19 + 0.5 = 19.5°C**
> - Med hysterese = 2°C ville varmen slå seg av ved **19 + 2 = 21°C**
>
> Hystereseverdien settes under innstillingene **«VINTER - Hysterese kjøling av»** og **«SOMMER - Hysterese varme av»** i automatiseringen.

Den beregnede modusen (`onsket_mode`) brukes også til å oppdatere **overordnet climate** (rom_climate), slik at overordnet alltid reflekterer den faktiske kjøle/varme-logikken. Overordnet oppdateres kun dersom den allerede er i `heat` eller `cool` – aldri fra `off`.

Dersom `input_select.driftsmodus_vinter_sommer` har en ugyldig verdi, holdes varmepumpa i `heat`-modus (se avsnitt 6.2).

## 7) Viftelogikk (Steg 7)

Aktives kun når `vifte_boost` er satt til `true` og varmepumpa støtter fan-moder.

| Tilstand | Vifte |
|---|---|
| Preset frost | `high` |
| Pådrag ≤ 30 % | `medium` |
| Pådrag > 50 % | `high` |
| Ellers | uendret |

Viften oppdateres kun ved faktisk endring.

## 8) Oppdateringslogikk – varmepumpe (Steg 8)

Varmepumpa oppdateres **kun når det er behov**:

- Settpunkt oppdateres kun hvis beregnet verdi avviker fra gjeldende settpunkt.
- Modus (`heat`/`cool`) oppdateres kun ved faktisk modusendring.
- Vifte oppdateres kun ved faktisk endring av vifte-modus.

Dette minimerer unødvendige skriv til varmepumpa og reduserer støy i logg og historikk.

## 9) Panelovn-proporsjonal-styring (Steg 9)

Aktiveres kun når `varme_climate` er konfigurert.

**Formål:** Panelovnen er et supplement til varmepumpa. Fremfor binær av/på-styring beregnes et proporsjonal settpunkt basert på temperaturunderskudd, slik at panelovnen trappes gradvis opp etter hvert som romtemperaturen faller under settpunktet.

### 9.1 Beregnings-logikk

| Tilstand | Resultat |
|---|---|
| Beregnet modus er `cool` ELLER overordnet er `off` | Settes til frost-setpunkt |
| Panelovn-mål = 0 % (pådrag ≤ grense) | Settes til frost-setpunkt |
| Panelovn-mål > 0 % | Proporsjonal: `frost + (settpunkt − frost) × prop` |

`prop = min(1, max(0, (settpunkt − romtemp) / panelovn_delta_maks))`

- `prop = 0`: romtemp ≥ settpunkt → settpunkt på varme-climate = frost-temp (effektivt av)
- `prop = 1`: romtemp ≥ `panelovn_delta_maks` under settpunkt → settpunkt = rom-settpunkt (fullt pådrag)

Setpunktet klampes alltid til klimaets egne `min_temp` og `max_temp` og oppdateres kun ved faktisk endring.

### 9.2 Eksempel

Settpunkt = 22 °C, frost = 10 °C, `panelovn_delta_maks` = 2,0 °C, grense = 60 %:

- Pådrag 40 % (< 60 %) → panelovn-mål = 0 % → panelovn frost (10 °C)
- Pådrag 70 % + romtemp 22,0 °C (delta = 0) → prop = 0 → panelovn frost (10 °C)
- Pådrag 70 % + romtemp 21,0 °C (delta = 1 °C) → prop = 0,5 → panelovn 16 °C
- Pådrag 70 % + romtemp 20,0 °C (delta = 2 °C) → prop = 1,0 → panelovn 22 °C

## 10) Pushover-varsling (Steg 10)

Sendes kun når `ix_pushover_varsling = true`, destination er satt, og det faktisk ble gjort en endring i kjøringen.

Meldingen inneholder:
- Modus (HEAT/COOL) og om den ble endret
- Romtemperatur og settpunkt
- Effektivt pådrag
- HP normalisert pådrag og grense (kun varme)
- Panelovn proporsjonal faktor, temp-delta og beregnet settpunkt (kun varme, kun hvis varme-climate er konfigurert)
- HP kjøle-settpunkt (kun kjøling)
- Vifte-endring (hvis aktuelt)

## 11) Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| `power_percent` mangler | Beregner pådrag fra `regulated_target_temperature` eller faller tilbake til 50 % |
| `regulated_target_temperature` mangler | Bruker 50 % som standardpådrag |
| `comfort_temp` mangler | Bruker rom-settpunkt direkte som basis |
| Varmepumpa støtter ikke fan-moder | Ingen vifte-oppdatering utføres |
| `input_select.driftsmodus_vinter_sommer` har ugyldig verdi | Varmepumpa holdes i `heat`-modus |
| Beregnet settpunkt utenfor `[pumpe_temp_min, pumpe_temp_maks]` | Klippes til absolutt grense |
| `varme_climate` ikke konfigurert | Steg 9 hoppes over; panelovn-variabler settes til 0/false |
| `preset_temperatures.frost_temp` mangler på overordnet climate | Bruker 10 °C som fallback |
| Beregnet settpunkt for varme-climate utenfor `[min_temp, max_temp]` | Klippes til klimaets absolutte grenser |
| Overordnet climate er `off` | Overordnet oppdateres ikke; panelovn settes til frost |
| `panelovn_padrag_grense` = 0 | hp_norm_power settes til 100 % (unngår divisjon med null) |

## 12) Statusverdier for feilsøking

Blueprinten gjør sentrale mellomverdier synlige i HA-trace (stegvise variabler), inkludert:

- `iclimate_varme_rt_pv` – målt romtemperatur
- `iclimate_varme_rt_spk` – rom-settpunkt
- `iclimate_varme_rt_sp_comfort_spkifnocomfort` – comfort-settpunkt (eller rom-settpunkt)
- `iclimate_varme_presetmode` – aktivt preset på rom-climate
- `iclimate_varme_has_power_percent` / `iclimate_varme_has_regulated_target` – tilgjengelighet av pådragssignal
- `varme_cur_power_calculated` – beregnet pådrag fra kilde A/B/C
- `varmepumpe_output_power_min_cause_min_faktor` – temperaturbasert min-pådrag
- `varmepumpe_output_power_min_cause_mode` – preset-basert min-pådrag
- `varmepumpe_output_power` – effektivt pådrag (etter min-klipping)
- `hp_padrag_grense` – pådrag-grense varmepumpe/panelovn
- `hp_norm_power_heat` – normalisert HP-pådrag (0–60 %→0–100 %, kun varme)
- `panelovn_maal_power` – panelovn mål-pådrag (0–100 %, 0 ved kjøling/ikke konfigurert)
- `hp_effective_power` – effektivt HP-pådrag brukt i settpunkt-formelen
- `iclimate_varme_rt_max_spk_spcomfort` – basissettpunkt (max av settpunkt og comfort)
- `varmepumpe_req_spk_raw` – råberegnet varmepumpe-settpunkt
- `varmepumpe_req_spk_incl_abs_limit` – settpunkt etter absolutt klipping
- `varmepumpe_req_spk_rounded_nearest_half` – avrundet til nærmeste 0.5
- `qnum_varmepumpe_req_spk` – endelig settpunkt etter ramp og avrunding
- `qx_varmepumpe_spk_update_needed` – true hvis settpunkt faktisk skal endres
- `WantCool_SetpointComfOrHihger` – kjøling tillatt (settpunkt ≥ comfort)
- `drift_modus_raw` / `drift_is_sommer` / `drift_is_vinter` / `drift_available` – driftsmodus-status
- `drift_hysterese_sommer` / `drift_hysterese_vinter` – hysterese brukt for å avslutte override i driftsmodus
- `summer_force_heat_on` / `summer_force_heat_keep` – sommer-override på/hold
- `winter_allow_cool_on` / `winter_allow_cool_keep` – vinter-override på/hold
- `inum_kjoling_sommer_kaldt_grense` / `inum_kjoling_vinter_varmt_grense` – dedikerte terskler for edge case
- `onsket_mode` – beregnet hvac-modus (`heat`/`cool`)
- `skal_oppdatere_mode` – true hvis modus faktisk skal endres
- `onsket_vifte` / `skal_oppdatere_vifte` – ønsket vifte-modus og om den skal settes
- `iclimate_overordnet_hvac_mode` – hvac-modus på overordnet climate (lest ved start)
- `iclimate_varme_frost_temp` – frost-settpunkt lest fra `preset_temperatures.frost_temp` (fallback 10 °C)
- `onsket_overordnet_mode` – beregnet ønsket hvac-modus for overordnet climate (`heat`/`cool`)
- `skal_oppdatere_overordnet` – true hvis overordnet climate skal oppdateres
- `panelovn_temp_delta` – romtemp-underskudd klampt til [0, panelovn_delta_maks] (°C)
- `panelovn_prop` – proporsjonal faktor 0.0–1.0 for panelovn-settpunkt
- `varme_styrt_onsket_spk_raw` – beregnet ønsket settpunkt for varme-climate (før klamping)
- `varme_styrt_min_temp` – min_temp lest fra varme-climate
- `varme_styrt_max_temp` – max_temp lest fra varme-climate
- `varme_styrt_onsket_spk` – ønsket settpunkt etter klamping til [min_temp, max_temp]
- `varme_styrt_naa_spk` – gjeldende settpunkt på varme-climate
- `varme_styrt_spk_update_needed` – true hvis varme-climate settpunkt skal endres

## 13) Dokumentasjon

- Blueprint-beskrivelsen lenker til denne README-filen:
  https://github.com/surematu/WebHomeHelpFiles/blob/main/README_varmepumpe_regulering.md
- Når blueprinten justeres, skal denne README-filen kontrolleres og oppdateres ved behov.
- Relatert blueprint: `driftsmodus_varme_kjoling_automatisk` setter `input_select.driftsmodus_vinter_sommer`.
  Dokumentasjon: [README_automatisk_valg_varme_kjoling.md](./README_automatisk_valg_varme_kjoling.md)
