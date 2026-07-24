# Funksjonsbeskrivelse – Varmepumpe (Rom) Robot

## 1) Formål

Denne funksjonen regulerer settpunktet på en varmepumpe kontinuerlig basert på pådragsnivået i et tilknyttet rom-climate.

Målet er at varmepumpen alltid leverer akkurat passe mye – ikke for mye og ikke for lite – slik at romtemperaturen holdes stabilt nær settpunktet uten at pumpen overstyrer.

Funksjonen støtter i tillegg:
- Sesongbasert styring via driftsmodus (VINTER/SOMMER), inkludert nødoverkobling av kjøling/varme ved ekstreme romtemperaturer.
- Valgfri vifteregulering (boost ved høyt pådrag).
- Minimum-pådrag basert på temperaturunderskudd og rom-preset (eco/comfort/boost).

## 2) Kjøretid

- Kjøring: hvert **10. minutt** (via `time_pattern`)
- Kjøring: ved **endring av settpunkt** på rom-climate (`state` trigger på `temperature`-attributt)
- 5 sekunder forsinkelse etter utløser for å la sensorer stabilisere seg

## 3) Forventede entiteter

Blueprinten konfigureres med to climate-entiteter:

| Entitet (input) | Beskrivelse |
|---|---|
| `climate` (rom_climate) | Rom-climate som gir pådragssignal og settpunkt |
| `climate` (pumpe_climate) | Varmepumpe-climate som styres av automasjonen |

Varmepumpe-reguleringen bruker alltid følgende entitet for sesongbasert styring (krever at kjøling er aktivert):

| Entitet | Beskrivelse |
|---|---|
| `input_select.driftsmodus_vinter_sommer` | Driftsmodus-helper med valgene VINTER og SOMMER |

## 4) Inngangsparametere

### 4.1 Varme (rom-climate)

| Parameter | Standard | Beskrivelse |
|---|---:|---|
| `padrag_regulated_offset_min` | −1 °C | Offset relativt til settpunkt som tilsvarer 0 % pådrag (brukes kun når `regulated_target_temperature` finnes og `power_percent` mangler) |
| `padrag_regulated_offset_maks` | +1 °C | Offset relativt til settpunkt som tilsvarer 100 % pådrag |

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
| `inum_kjoling_pa_delta` | 2 °C | Delta over settpunkt for å aktivere kjøling i fallback uten gyldig driftsmodus |
| `inum_kjoling_av_delta` | 0.5 °C | Hysterese for å slå av aktiv override i driftsmodus (og AV-terskel i fallback) |
| `inum_kjoling_sommer_kaldt_grense` | 2 °C | SOMMER: tving heat når romtemp er mer enn denne verdien under settpunkt |
| `inum_kjoling_vinter_varmt_grense` | 2 °C | VINTER: tillat cool som nødoverkobling når romtemp er mer enn denne verdien over settpunkt |

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

### 5.3 Settpunkt-kurve (Steg 4)

Basissettpunkt = `max(rom_settpunkt, comfort_temp)` (dersom comfort-preset finnes).

Varmepumpe-settpunkt (råverdi) = `basis + grader_under_min + (pådrag / 100) × (grader_over_maks − grader_under_min)`

- Ved 0 % pådrag: `basis + grader_under_min` (typisk basis − 3 °C)
- Ved 100 % pådrag: `basis + grader_over_maks` (typisk basis + 3 °C)

Råverdien klippes deretter til `[pumpe_temp_min, pumpe_temp_maks]`.

### 5.4 Ramp-begrensning og avrunding (Steg 4, forts.)

For å unngå brå hopp begrenses endringen til `±maks_endring_per_kjoring` fra gjeldende varmepumpe-settpunkt.

Avrunding:
- Heltall-steg (1, 2, 3, …): settpunkt avrundes til nærmeste heltall
- Halvt steg (0.5, 1.5, 2.5, …): halvgrads-verdier tillates (f.eks. 22.5 °C)

## 6) Kjøling og driftsmodus (Steg 6)

### 6.1 Uten kjøling aktivert

Varmepumpa kjøres alltid i `heat`-modus. Ingen modusbytte utføres.

### 6.2 Kjøling aktivert – driftsmodus ugyldig verdi (fallback)

Hvis `input_select.driftsmodus_vinter_sommer` ikke har verdi VINTER eller SOMMER (f.eks. unavailable), baseres beslutning utelukkende på romtemperatur vs settpunkt:

- Bytt til `cool` når `romtemperatur ≥ settpunkt + kjoling_pa_delta`
- Bytt tilbake til `heat` når `romtemperatur ≤ settpunkt + kjoling_av_delta` (hysterese)
- Kjøling sperres alltid når settpunkt er under comfort-settpunkt (f.eks. eco/natt-senking) – pumpa tvinges til `heat`

### 6.3 Kjøling aktivert – med driftsmodus (VINTER / SOMMER)

Bruker alltid `input_select.driftsmodus_vinter_sommer` (sett av `driftsmodus_varme_kjoling_automatisk`-blueprinten) for sesongbasert styring med tydelig default + override:

- **SOMMER default:** `cool`
- **VINTER default:** `heat`

Override aktiveres kun ved store avvik, og hysterese (`inum_kjoling_av_delta`) brukes for å slå override av igjen:

#### SOMMER (default = kjøling)

| Tilstand | Resultat |
|---|---|
| Settpunkt < comfort-settpunkt | `heat` (kjøling sperret) |
| Romtemp < settpunkt − `inum_kjoling_sommer_kaldt_grense` | `heat` (override PÅ: tvungen varme) |
| Aktiv tvungen varme og romtemp < settpunkt + `inum_kjoling_av_delta` | `heat` (override holdes aktiv) |
| Ellers | `cool` (override AV, tilbake til default) |

#### VINTER (default = varme)

| Tilstand | Resultat |
|---|---|
| Settpunkt < comfort-settpunkt | `heat` (kjøling sperret) |
| Romtemp > settpunkt + `inum_kjoling_vinter_varmt_grense` | `cool` (override PÅ: tvungen kjøling) |
| Aktiv tvungen kjøling og romtemp > settpunkt − `inum_kjoling_av_delta` | `cool` (override holdes aktiv) |
| Ellers | `heat` (override AV, tilbake til default) |

Tanken bak oppsettet er at driftsmodus bestemmer normal retning, mens dedikerte terskler (`inum_kjoling_sommer_kaldt_grense` og `inum_kjoling_vinter_varmt_grense`) avgjør når override skal slå inn. Hysterese brukes kun for å avslutte override stabilt, slik at modus ikke flapper rundt tersklene.

Dersom `input_select.driftsmodus_vinter_sommer` har en ugyldig verdi, brukes logikken fra avsnitt 6.2 (temperaturbasert fallback).

## 7) Viftelogikk (Steg 5)

Aktives kun når `vifte_boost` er satt til `true` og varmepumpa støtter fan-moder.

| Tilstand | Vifte |
|---|---|
| Preset frost | `high` |
| Pådrag ≤ 30 % | `medium` |
| Pådrag > 50 % | `high` |
| Ellers | uendret |

Viften oppdateres kun ved faktisk endring.

## 8) Oppdateringslogikk (Steg 7)

Varmepumpa oppdateres **kun når det er behov**:

- Settpunkt oppdateres kun hvis beregnet verdi avviker fra gjeldende settpunkt.
- Modus (`heat`/`cool`) oppdateres kun ved faktisk modusendring.
- Vifte oppdateres kun ved faktisk endring av vifte-modus.

Dette minimerer unødvendige skriv til varmepumpa og reduserer støy i logg og historikk.

## 9) Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| `power_percent` mangler | Beregner pådrag fra `regulated_target_temperature` eller faller tilbake til 50 % |
| `regulated_target_temperature` mangler | Bruker 50 % som standardpådrag |
| `comfort_temp` mangler | Bruker rom-settpunkt direkte som basis |
| Varmepumpa støtter ikke fan-moder | Ingen vifte-oppdatering utføres |
| `input_select.driftsmodus_vinter_sommer` har ugyldig verdi | Faller tilbake til temperaturbasert kjøle-/varme-beslutning |
| Beregnet settpunkt utenfor `[pumpe_temp_min, pumpe_temp_maks]` | Klippes til absolutt grense |

## 10) Statusverdier for feilsøking

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
- `iclimate_varme_rt_max_spk_spcomfort` – basissettpunkt (max av settpunkt og comfort)
- `varmepumpe_req_spk_raw` – råberegnet varmepumpe-settpunkt
- `varmepumpe_req_spk_incl_abs_limit` – settpunkt etter absolutt klipping
- `varmepumpe_req_spk_rounded_nearest_half` – avrundet til nærmeste 0.5
- `qnum_varmepumpe_req_spk` – endelig settpunkt etter ramp og avrunding
- `qx_varmepumpe_spk_update_needed` – true hvis settpunkt faktisk skal endres
- `WantCool_SetpointComfOrHihger` – kjøling tillatt (settpunkt ≥ comfort)
- `WantCoolCauseHighTempFallback` – fallback-kjøling ønsket (romtemp over delta uten gyldig driftsmodus)
- `drift_modus_raw` / `drift_is_sommer` / `drift_is_vinter` / `drift_available` – driftsmodus-status
- `drift_hysterese` – hysterese brukt for å avslutte override i driftsmodus
- `summer_force_heat_on` / `summer_force_heat_keep` – sommer-override på/hold
- `winter_allow_cool_on` / `winter_allow_cool_keep` – vinter-override på/hold
- `inum_kjoling_sommer_kaldt_grense` / `inum_kjoling_vinter_varmt_grense` – dedikerte terskler for edge case
- `onsket_mode` – beregnet hvac-modus (`heat`/`cool`)
- `skal_oppdatere_mode` – true hvis modus faktisk skal endres
- `onsket_vifte` / `skal_oppdatere_vifte` – ønsket vifte-modus og om den skal settes

## 11) Dokumentasjon

- Blueprint-beskrivelsen lenker til denne README-filen:
  https://github.com/surematu/WebHomeHelpFiles/blob/main/README_varmepumpe_regulering.md
- Når blueprinten justeres, skal denne README-filen kontrolleres og oppdateres ved behov.
- Relatert blueprint: `driftsmodus_varme_kjoling_automatisk` setter `input_select.driftsmodus_vinter_sommer`.
  Dokumentasjon: [README_automatisk_valg_varme_kjoling.md](./README_automatisk_valg_varme_kjoling.md)
