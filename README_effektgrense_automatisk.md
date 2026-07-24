# KWh-grense – Automatisk justering basert på temperatur og måned

## 1. Formål

Denne automasjonen justerer automatisk en kWh-grense (effektgrense) basert på forventet utetemperatur og et konfigurerbart månedsminsimum.

Målet er at strømforbruket tillates å være høyere på kalde dager der behovet er reelt, men aldri lavere enn et satt minimum for den aktuelle måneden. Dette er nyttig for å unngå unødvendige kostnader på varme dager, men samtidig sikre nok kapasitet om vinteren.

## 2. Eksempler på bruk

- **Kald vinterpdag:** Prognosen viser −10 °C i snitt neste 24 timer. Automasjonen setter grensen til 9 kWh (veryCold-minimum).
- **Mildvær om høsten:** Prognosen viser 9 °C. Grensen settes til 4,5 kWh (littleCold-minimum).
- **Sommervær:** Prognosen viser 18 °C. Grensen settes til minimum for den aktuelle måneden (f.eks. 4,5 kWh i august).
- **Månedsskifte:** Første dag i en ny måned kan grensen også nedjusteres (normalt skrives bare høyere verdier).

## 3. FAQ – Ofte stilte spørsmål

**Hva er en kWh-grense?**
Det er en grense for maksimalt strømforbruk per time. Home Assistant (eller et eksternt system) kan bruke denne verdien til å styre varme, lading av elbil osv.

**Hvorfor endrer grensen seg automatisk?**
Fordi varmebehovet endrer seg med temperaturen. På kalde dager trengs mer strøm, og det er rimelig å tillate det. På milde dager er det unødvendig med høy grense.

**Hva er månedsminimumet?**
Et nedre gulv for grensen som gjelder uavhengig av temperatur. Det sikrer at grensen aldri settes for lavt selv på milde dager i kalde måneder.

**Hva skjer om prognosen mangler?**
Automasjonen faller tilbake til nåværende utetemperatur (`sensor.utetemperatur`). Den vil velge den kaldeste av prognose-snittet og nåverdien.

**Hvorfor nedjusteres ikke grensen midtveis i måneden?**
Automasjonen skriver bare lavere verdier første time første dag i måneden, slik at grensen ellers bare kan gå opp i løpet av måneden (aldri ned). Dette hindrer at grensen faller tilbake på grunn av mildvær om vinteren.

## 4. Hva slags info trengs

- En **vær-entitet** i Home Assistant som støtter timeprognose (f.eks. yr.no)
- En **input_number-entitet** som skal brukes som kWh-grense
- Nåværende utetemperatur er **hardkodet** til `sensor.utetemperatur` (endre i YAML-filen ved behov)

## 5. Innstillinger

**Hovedinnganger:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Vær entitet | – | Weather-entitet som brukes for timeprognose |
| Grense entitet (input_number) | – | Den input_number som settes av automasjonen |

**Temperaturgrenser:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Antall timer (forecast-snitt) | 24 | Antall timer fremover som brukes for temperatursnitt |
| veryCold – grader | −8 °C | Snitt under eller lik denne → bruk veryCold-minimum |
| veryCold – minimum (kWh) | 9 | kWh-grense ved veldig kaldt vær |
| littleCold – grader | 8 °C | Snitt under eller lik denne (men over veryCold) → bruk littleCold-minimum |
| littleCold – minimum (kWh) | 4,5 | kWh-grense ved litt kaldt vær |
| Varmt – minimum (kWh) | 1,7 | kWh-grense ved varmt vær (over littleCold-grensen) |

**Månedsminimum (kWh):**

| Måned | Standard |
|---|---:|
| Januar | 9 |
| Februar | 9 |
| Mars–Desember | 4,5 |

**Valgfritt:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Status input_text | (tomt) | Valgfri entitet som oppdateres med kort statusinfo |
| Pushover destination | pushover | Mottakergruppe. La stå tomt for å deaktivere varsling |
| Pushover prioritet | 0 | Prioritet for varselet |
| Pushover TTL (sekunder) | 604800 | Levetid for varselet (604800 = 7 dager) |

## 6. Funksjonsbeskrivelse

Automasjonen kjøres hver hele time og gjør følgende:

1. Henter timeprognose fra vær-entiteten og beregner snitttemperatur for de neste N timene
2. Leser nåværende utetemperatur fra `sensor.utetemperatur`
3. Velger den laveste (kaldeste) av prognose-snittet og nåtemperaturen
4. Finner temperaturbasert minimum ut fra tre nivåer: veldig kaldt, litt kaldt, varmt
5. Sammenligner med månedsminimumet for inneværende måned
6. Den endelige ønskede grensen er den høyeste av de to minimumene
7. Skriver til input_number kun hvis:
   - Ønsket verdi er **høyere** enn nåværende verdi, **eller**
   - Det er første time første dag i måneden (da kan grensen også settes lavere)

## 7. Resultat

- **`input_number`** (grense-entiteten) oppdateres med ny kWh-grense når vilkårene er oppfylt
- Valgfri **`input_text`** oppdateres med en kort statusbeskrivelse

## 8. Avansert

### 8.1 Forutsettninger

- **`sensor.utetemperatur`** – nåværende utetemperatur (hardkodet, endre i YAML ved behov)
- Vær-entitet som støtter `weather.get_forecasts` (hourly)
- Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome` (for varsling)
- En `input_number` som brukes som kWh-grense
- Valgfri: `input_text` for statusoppdatering

### 8.2 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for Pushover-utsending |

### 8.3 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `io_outdoor_temp_comming` | Snitttemperatur beregnet fra forecast (neste N timer) |
| `temp_source` | Kaldeste av forecast-snitt og nåværende utetemperatur |
| `temp_min_limit` | Temperaturbasert minimum kWh (fra tre nivåer) |
| `month_min_limit` | Månedsminimumet for inneværende måned |
| `desired_limit` | Endelig ønsket kWh-grense (`max(temp_min_limit, month_min_limit)`) |
| `io_current_limit` | Nåværende verdi i grense-entiteten |

### 8.4 Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| Forecast mangler | Bruker nåværende utetemperatur (`sensor.utetemperatur`) som fallback |
| `sensor.utetemperatur` utilgjengelig | Beregning kan feile – ingen skriving utføres |
| Pushover destination er tomt | Varsling deaktiveres stille |

### 8.5 Varsling og debug info

Varsling er aktivert som standard (pushover destination er satt til `pushover`). Varsel sendes kun når verdien faktisk endres.

**Tittel:**
> ⚡ KWh-grense ⚡

**Eksempel på melding:**
> Basert på: Utetemp (−10°C = 9 kWh) og måned (9 kWh)
> Justering: 4,5 kWh → 9 kWh.

For å deaktivere varsling, tøm feltet «Pushover destination» i innstillingene.


- Valgfri `input_text` kan brukes for å se siste status uten å gå inn i logg
- Pushover-varslet inneholder beregningsverdiene for enkel kontroll

## 9. Annet

### 9.1 Reset ved månedsskifte

Kun første dag i måneden, kl. 00:xx, tillater automasjonen å sette en lavere verdi enn nåværende. Dette fungerer som en månedlig tilbakestilling, slik at grensen kan starte lavt igjen etter en kald periode.

## 10. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/effektgrense_automatisk.yaml
- Pushover script: [README_varsel_pushover.md](./README_varsel_pushover.md)
