# Funksjonsbeskrivelse – Varsel - Printer - Blekk/Toner lavt

## 1) Formål

Denne automasjonen finner printer-relaterte sensorer automatisk og varsler når blekk/toner er lavere enn terskel.
Den kan også kjøre etter at valgte "wake-up"-entiteter blir tilgjengelige igjen.

## 2) Triggere

- Planlagt sjekk på valgt tid og ukedager
- Wake-up trigger når valgt entity går fra `unavailable/unknown` til tilgjengelig

## 3) Hovedlogikk

1. Ved wake-up: vent konfigurerte minutter for stabilisering
2. Finn blekk/toner-sensorer ved keyword + mønstergjenkjenning
3. Gruppér sensorer per printer
4. For hver printer: finn laveste verdi per farge/type under terskel
5. Bygg samlet melding for alle printere med avvik
6. Send varsel kun når det faktisk finnes avvik

## 4) Deteksjon

- Søker i `sensor.*` etter valgt keyword (default `printer`)
- Matcher blekk/toner-begreper i entity-id/friendly name
- Krever prosent-aktige verdier (unit `%` eller verdi 0-100)
- Sorterer og renderer problem-lister per printer

## 5) Varsling

- Pushover-melding med printer-navn og verdier under terskel
- Valgfri debug-detalj med trigger, tellerverdier og match-statistikk

## 6) Viktige innganger

- Blekkterskel (%)
- Planlagt tidspunkt og ukedager
- Keyword for auto-detektering
- Wake-up entities + ventetid
- Pushover destination, prioritet og TTL
- Valgfri debug

## 7) Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/varsel_printer.yaml
