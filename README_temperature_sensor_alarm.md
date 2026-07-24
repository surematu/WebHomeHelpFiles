# Funksjonsbeskrivelse – Temperature Sensor Alarm

## 1) Formål

Denne automasjonen sender Pushover-varsel for en temperatursensor ved varighet over terskler eller manglende verdi.

## 2) Triggere

- Temperatur over `alarm_1_threshold` i 15 minutter
- Temperatur over `alarm_2_threshold` i 60 minutter
- Sensor i state `unknown` i 15 minutter

## 3) Varselinnhold

- Tittel: valgt sensornavn (custom navn hvis satt, ellers friendly_name/entity_id)
- Melding avhenger av trigger:
  - over terskel 1 i 15 minutter
  - over terskel 2 i 60 minutter
  - ukjent i 15 minutter

## 4) Viktige innganger

- Temperatursensor
- Valgfritt custom sensornavn
- Terskel 1 og terskel 2
- Pushover destination, prioritet og TTL

## 5) Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/temperature_sensor_alarm.yaml
