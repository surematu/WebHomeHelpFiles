# WebHome – WatchDog – skrur på igjen climate som står av og starter Tailscale og Cloudflare-tunnel

## 1. Formål

Felles watchdog for en WebHome-installasjon. Én automasjon per Home Assistant passer på ting som alltid skal være på, og retter dem selv når de har falt ut:

- **Alt. 1 Climate:** termostater i Versatile Thermostat som har stått AV i 10 sekunder skrus PÅ igjen (heat). Har termostaten mistet preset, settes den tilbake når settpunktet passer til en preset.
- **Alt. 2 Tailscale:** Tailscale-tillegget startes når det ikke har kjørt på 10 minutter.
- **Alt. 3 Cloudflare-tunnel:** tillegget Cloudflared startes når det ikke har kjørt på 10 minutter.

Automasjonen kjører bare når noe er galt, pluss ved oppstart av Home Assistant og en sikkerhetssjekk én gang i timen. Sender Pushover-varsel når den griper inn.

## 2. Eksempler på bruk

- **Etter omstart:** Home Assistant starter på nytt, og en termostat kommer opp som AV uten preset. Watchdogen skrur den på og setter preseten tilbake.
- **Noen skrur av ved et uhell:** en termostat blir skrudd av i dashbordet. Etter 10 sekunder er den på igjen.
- **Fjerntilgang faller ut:** Tailscale-tillegget stopper. Etter 10 minutter startes det på nytt, slik at fjerntilgangen kommer tilbake uten besøk på stedet.
- **Kundeportalen faller ut:** tillegget Cloudflared stopper, og kunden når ikke Home Assistant via portalen. Etter 10 minutter startes det på nytt.

## 3. FAQ – Ofte stilte spørsmål

**Hvorfor kommer termostaten på igjen når jeg skrur den av?**
Det er watchdogen. Den skrur på alle termostater i Versatile Thermostat som står av. Skal en termostat stå av med vilje, legg den i «Climate som holdes utenfor» eller skru av automasjonen.

**Hvorfor tar det 10 sekunder?**
Uten ventetid ser det ut som om av-knappen i Home Assistant ikke virker. Med 10 sekunder ser du at termostaten blir AV før den kommer på igjen. Ventetiden kan justeres.

**Må jeg velge hvilke termostater som skal overvåkes?**
Nei. Den går selv gjennom alle climate i integrasjonen Versatile Thermostat. Nye termostater kommer med automatisk.

**Hva med varmepumper som også kan kjøle?**
Watchdogen setter alltid `heat`. En varmepumpe som skal kunne stå av eller kjøle, må legges i «Climate som holdes utenfor».

**Hvilken preset settes tilbake?**
Den som har samme temperatur som settpunktet termostaten står på. Temperaturene leses fra termostaten selv, så det er ingen faste tall i automasjonen. Temperaturen endres aldri.

**Hva skjer når jeg kjører automasjonen manuelt?**
Den gjør det samme som ellers. Er ingen termostat av, og Tailscale og Cloudflared kjører, skjer ingenting.

## 4. Hva slags info trengs

- Ingenting må velges for standard bruk. Alle innstillinger har standardverdier.
- Integrasjonen Versatile Thermostat (for climate-delen).
- Tailscale-tillegget og `binary_sensor.tailscale_running` (for Tailscale-delen).
- Tillegget Cloudflared og `binary_sensor.cloudflared_running` (for Cloudflare-delen).
- «Running»-sensorene er deaktivert som standard i Home Assistant og må aktiveres, se 10.1.
- Scriptet `script.varsel_pushover_send_melding_webhome` (for varsling).

## 5. Innstillinger

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Overvåk climate | På | Skrur på igjen climate i Versatile Thermostat som står av |
| Climate må ha stått av i (sekunder) | 10 | Ventetid før en climate skrus på igjen |
| Climate som holdes utenfor | (ingen) | Climate watchdogen ikke skal røre |
| Sett tilbake mistet preset | På | Setter preseten som passer til settpunktet når preset er `none` |
| Overvåk Tailscale | På | Starter Tailscale-tillegget når det ikke kjører |
| Tailscale kjører | `binary_sensor.tailscale_running` | Sensor som er PÅ når tillegget kjører |
| Tailscale må ha stått av i (minutter) | 10 | Ventetid før tillegget startes |
| Tailscale-tillegg (slug) | `a0d7b954_tailscale` | Trengs normalt ikke å justeres |
| Overvåk Cloudflare-tunnel | På | Starter tillegget Cloudflared når det ikke kjører |
| Cloudflared kjører | `binary_sensor.cloudflared_running` | Sensor som er PÅ når tillegget kjører |
| Cloudflared må ha stått av i (minutter) | 10 | Ventetid før tillegget startes |
| Cloudflared-tillegg (slug) | `396f0234_cloudflared` | Trengs normalt ikke å justeres |

<details>
<summary>Varsling (Valgfri)</summary>

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Send varsel når watchdogen griper inn | På | Pushover når en climate er skrudd på igjen, eller Tailscale eller Cloudflared er startet |
| Pushover destination (valgfri) | pushover | Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres slik at den blir sendt ulikt. |
| Pushover priority | 0 | −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd), 1 (Høy prioritet, rødt varsel, omgår stilleperiode), 2 (nødvarsel som gjentas til det bekreftes). |
| Levetid varsel (timer) | 168 | Hvor lenge skal varslet være synlig før det forsvinner? Verdien i Pushover-pakken er i sekunder; scriptet regner om fra timer. |
| Send varsel ved manuell kjøring | Av | Sett til true for å sende varsel når automasjonen kjøres manuelt. Sett til false for å ikke sende varsel ved manuell kjøring. |

</details>

## 6. Funksjonsbeskrivelse

Automasjonen utløses av seks ting:

1. **En climate har stått av** i valgt antall sekunder.
2. **Tailscale har stått av** i valgt antall minutter.
3. **Cloudflared har stått av** i valgt antall minutter.
4. **Sikkerhetssjekk** én gang i timen (på halv), i tilfelle et forsøk har feilet.
5. **Home Assistant har startet.** Termostater kan komme opp som AV etter en omstart.
6. **Automasjonen er skrudd på eller lagret.**

Før betingelsen regnes tre variabler ut: `climate_av` (liste over climate som er av), `tailscale_av` og `cloudflare_av` (true når tillegget har stått av lenge nok). Er listen tom og begge tilleggene i orden, stopper automasjonen på betingelsen og regnes ikke som utløst.

Deretter går den gjennom alternativene i rekkefølge, og kjører de som har noe å rette:

- **Alt. 1 Climate:** setter `heat` på alle i listen, setter tilbake mistet preset og sender varsel.
- **Alt. 2 Tailscale:** starter tillegget og sender varsel.
- **Alt. 3 Cloudflare-tunnel:** starter tillegget Cloudflared og sender varsel.

Hvert alternativ er sin egen blokk, så flere ting kan rettes i samme kjøring.

Ventetiden på 10 sekunder gjelder bare utløser 1. Ved oppstart, sikkerhetssjekk og manuell kjøring skrus en climate som er av på med en gang.

## 7. Resultat

- Climate i Versatile Thermostat som sto av, står i `heat`, eventuelt med preset satt tilbake.
- Tailscale-tillegget og/eller Cloudflared er startet.
- Ingen hjelpere skrives til.

## 8. Varsling

Varsling er aktiv som standard.

**Climate skrudd på igjen**
> 🌡️ Climate skrudd på igjen
> Sto av og er skrudd på igjen: Varme (Entre Styret)

**Tailscale startet**
> 🔗 Tailscale startet
> Tailscale kjørte ikke på 10 minutter og er startet på nytt.

**Cloudflare-tunnel startet**
> ☁️ Cloudflare-tunnel startet
> Cloudflared kjørte ikke på 10 minutter og er startet på nytt.

## 9. Annet

- Automasjonen skal ligge i kategorien **WebHome_Default** og ha etiketten **WebHome_Default** (svart, `mdi:cog`), og hete **WebHome (WatchDog)**.
- Den erstatter den gamle automasjonen «Tailscale (Watchdog)», som skal slettes der den finnes.
- En termostat kan ikke stå av så lenge watchdogen er på, med mindre den ligger i «Climate som holdes utenfor».

## 10. Avansert

### 10.1 Forutsettninger

- Home Assistant 2025.11 eller nyere.
- Integrasjonen Versatile Thermostat for climate-delen. Finnes den ikke, er listen alltid tom og climate-delen gjør ingenting.
- Tailscale-tillegget (`a0d7b954_tailscale`) og `binary_sensor.tailscale_running` for Tailscale-delen.
- Tillegget Cloudflared (`396f0234_cloudflared`) og `binary_sensor.cloudflared_running` for Cloudflare-delen.
- **«Running»-sensorene må aktiveres.** De er deaktivert som standard. Gå til Innstillinger → Enheter og tjenester → Home Assistant Supervisor → tillegget, og aktiver «Running». Er sensoren ikke aktivert, gjør den delen ingenting.
- «Running» viser om tillegget kjører, ikke om tunnelen har kontakt med Cloudflare. Supervisor oppdaterer sensoren med noen minutters mellomrom.
- Script-blueprintet `varsel_pushover.yaml` (script `script.varsel_pushover_send_melding_webhome`). Mangler scriptet, hopper automasjonen over varselet og fortsetter.

### 10.2 Eksempler

Automasjon fra blueprintet med standardverdier, og én varmepumpe holdt utenfor:

```yaml
alias: WebHome (WatchDog)
description: ""
use_blueprint:
  path: surematu/webhome_watchdog.yaml
  input:
    climate_unntak:
      - climate.stue_klima
```

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for å sende Pushover-varsler. Brukes for utsending. |

### 10.4 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `climate_av` | Climate i Versatile Thermostat som er `off`, uten de som holdes utenfor. Regnes ut før betingelsen. |
| `tailscale_av` | True når Tailscale-sensoren har vært `off` i minst valgt antall minutter. Regnes ut før betingelsen. |
| `cloudflare_av` | True når Cloudflared-sensoren har vært `off` i minst valgt antall minutter. Regnes ut før betingelsen. |
| `climate_av_funnet`, `tailscale_av_funnet`, `cloudflare_av_funnet` | Kopi av de tre over, satt i Steg 3 slik at de vises i trace også ved manuell kjøring. |
| `is_manual_run`, `trigger_id` | Hvorfor automasjonen kjører. |
| `preset_funnet` | Per climate: preseten som har samme temperatur som settpunktet, eller tom. |
| `climate_navn` | Navnene på climate som ble skrudd på, til varselet. |

**Lese trace:** ved vanlige kjøringer vises `climate_av`, `tailscale_av` og `cloudflare_av` under «Changed variables» på utløser-noden. Ved manuell kjøring vises de i Steg 3. Automasjonen lagrer de 100 siste kjøringene.

### 10.5 Feilhåndtering

- **Utløseren slår bare til når en climate går til av.** En climate som allerede er av når automasjonen lagres, tas av utløseren «Automasjonen er skrudd på», ellers av sikkerhetssjekken.
- **To climate av i samme sekund:** begge tas i samme kjøring. Går en av mens en kjøring pågår, tas den av sikkerhetssjekken.
- **Climate uten `heat`:** `climate.set_hvac_mode` feiler for den. Legg den i «Climate som holdes utenfor».
- **Tailscale eller Cloudflared starter ikke:** det prøves på nytt ved hver sikkerhetssjekk. Feiler selve startkommandoen, vises feilen i trace og automasjonen fortsetter.

### 10.6 Varsling og debug info

Ingen debug-varsling. «Send varsel ved manuell kjøring» (av som standard) sender en kort status med hva som ble funnet.

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/webhome_watchdog.yaml
- Pushover script: [README_varsel_pushover.md](./README_varsel_pushover.md)
- Versatile Thermostat: https://github.com/jmcollin78/versatile_thermostat
