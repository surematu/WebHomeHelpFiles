# Funksjonsbeskrivelse – Kalender - Kalkulert varmebehov

## 1) Formål

Denne automasjonen beregner når forvarming og normal varme skal aktiveres før kalenderhendelser.
Den bruker kalender, innetemperatur og værprognose for å anslå oppvarmingstid, og styrer to `input_boolean`-entiteter.

## 2) Kjøretid og triggere

- Kjøres hvert 10. minutt
- Kjøres ved Home Assistant restart (med forsinket oppstart)

## 3) Datagrunnlag

- Kalenderhendelser fra én eller flere kalendere (`calendar.get_events`)
- Timeprognose fra valgt weather-entitet (`weather.get_forecasts`)
- Innetemperatursensor
- Nåværende utetemperatur (`sensor.utetemperatur`, hardkodet)

## 4) Valg av hendelse

- Hvis nøkkelord i `location` er satt: første event som matcher nøkkelordet brukes
- Hvis nøkkelord er tomt: første kommende event brukes
- Samtidig beregnes første event uansett for 24t-informasjonsvarsel

## 5) Beregning av starttid

- Oppvarmingshastighet velges fra temperaturintervaller
- Behov i grader = `måltemperatur - nåværende innetemperatur` (min 0)
- Beregnet oppvarmingstid inkluderer valgt buffer
- Forvarmingsstart rundes ned til nærmeste `:00`/`:30`
- Forvarming settes ikke senere enn 1 time før event-start

## 6) Styring av booleans

- `heat_boolean` settes på i selve varmevinduet
- `preheat_boolean` settes på i forvarmingsvinduet før varmevinduet
- Utenfor vinduene settes begge av

## 7) Varsling og status

- Valgfri status i `input_text` med kort oppsummering
- Valgfritt 24t Pushover-varsel når neste event er omtrent 24 timer frem i tid
- 24t-varsel kan angi både "varme planlagt" og "ingen varme" avhengig av location-filter

## 8) Viktige innganger

- Kalender-entiteter
- Weather-entitet
- Innetemperatursensor
- `preheat_boolean` og `heat_boolean`
- Nøkkelord for location-filter
- Måltemperatur, buffer og lookahead
- Valgfri status-text + Pushover innstillinger

## 9) Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/kalender_kalkulert_varmebehov.yaml
