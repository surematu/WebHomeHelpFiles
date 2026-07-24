# Funksjonsbeskrivelse – KWh-grense - Temperatur + månedsminimum

## 1) Formål

Denne automasjonen setter en `input_number` (kWh-grense) basert på forventet utetemperatur og et månedsminimum.
Målet er at grensen følger værforhold, men aldri går under valgt minimum for aktuell måned.

## 2) Kjøretid

- Kjøres **hver hele time** (`time_pattern`, minute 0)

## 3) Datagrunnlag

- Timeprognose (`weather.get_forecasts`, hourly)
- Snittemperatur for neste N timer (`hours_to_check`, standard 24)
- Nåværende utetemperatur (`sensor.utetemperatur`, hardkodet)
- Dagens verdi i mål-`input_number`
- Månedsminimum for aktiv måned

## 4) Beregningslogikk

1. Beregn snittemperatur fra forecast for neste N timer
2. Velg kaldeste av forecast-snitt og nåværende utetemperatur
3. Finn temperaturbasert minimum via tre nivåer:
   - `veryCold` (<= veryCold_grader)
   - `littleCold` (<= littleCold_grader)
   - ellers `warm_min`
4. Endelig ønsket grense = `max(temp_min_limit, month_min_limit)`

## 5) Skriveregler

- Vanlig drift: skriver bare hvis ønsket verdi er **høyere** enn nåværende verdi
- Reset-vindu: første dag i måneden kl. 00 skrives også **lavere** verdi ved behov

## 6) Varsling og status

- Valgfri oppdatering av `input_text` med kort status/debug
- Valgfri Pushover varsling når verdien faktisk skrives

## 7) Viktige innganger

- Weather-entitet
- Mål-`input_number`
- Antall forecast-timer (`hours_to_check`)
- Temperaturgrenser og kWh-verdier (`veryCold`, `littleCold`, `warm`)
- Månedsminimum for alle 12 måneder
- Valgfri status-text + Pushover innstillinger

## 8) Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/effektgrense_automatisk.yaml
