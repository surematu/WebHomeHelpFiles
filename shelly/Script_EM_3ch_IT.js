// Setup variables

// -1 = use measured cos phi.
// Example 1.00 = use assumed power factor.
let ASSUMED_POWER_FACTOR = 0.85;

// Power/energy is multiplied with this factor
let CALIBRATION_FACTOR = 0.85;

// Tittel: IT 3 fas energikalkulering målt 2 faser - V4
// Link: https://github.com/surematu/WebHomeHelpFiles/blob/main/shelly/Script_EM_3ch_IT.js
// Shelly Pro 3EM - beregnet effekt og energi for 230 V IT-nett
// Virtuelle komponenter opprettes automatisk dersom de mangler.
// Komponentene finnes og brukes etter navn.
// Changelog:
// V2 - 02.09.2026: Endret fra kw til w på effekt
// V2.1 - 16.09.2026: Flyttet oppsettvariabler og gjorde EM/navn statiske.
// V2.2 - 20.09.2026: Cosphi min, max valid added.
// V3.0 - 20.09.2026: Utbedret kalkulering ved estimert cos phi. Må kalkuleres basert på amp og ikke power, da power allerede tar hensyn til cos phi.
// V4.0 - 21.09.2026: Forenklet til alltid å beregne per fase med spenning × strøm × cos phi, med snitt som fallback ved manglende faseverdier.
// V4.1 - 21.09.2026: Målt cos phi beregnes nå bare fra faser med gyldig spenning, etter min/max-avgrensning.

// Startverdi dersom ingen energi er lagret tidligere.
let INITIAL_ENERGY_KWH = 0.0;

let SAMPLE_INTERVAL_MS = 1000;
let ENERGY_DISPLAY_INTERVAL_MS = 10000;
let ENERGY_SAVE_INTERVAL_MS = 60000;

let MIN_VALID_VOLTAGE = 100;
let MAX_VALID_VOLTAGE = 280;
// Brukes bare for målte cos phi-verdier.
let MIN_VALID_MEASURED_COS_PHI = 0.8;
let MAX_VALID_MEASURED_COS_PHI = 1;
let powerVc = null;
let energyVc = null;

let energyKwh = INITIAL_ENERGY_KWH;
let lastSampleMs = 0;
let lastDisplayMs = 0;
let lastSaveMs = 0;
let lastMode = "";
let calculationStarted = false;
let warnedPowerFactor = false;

let VIRTUAL_COMPONENTS = [
  {
    role: "power",
    name: "Effekt kalkulert",
    type: "number",
    config: {
      name: "Effekt kalkulert",
      min: 0,
      max: 100000,
      default_value: 0,
      persisted: false,
      meta: {
        ui: {
          view: "label",
          unit: "W",
          step: 1,
          webIcon: "power"
        },
        cloud: ["measurement", "log"]
      }
    }
  },
  {
    role: "energy",
    name: "Energi kalkulert",
    type: "number",
    config: {
      name: "Energi kalkulert",
      min: 0,
      max: 1000000000,
      default_value: 0,
      persisted: true,
      meta: {
        ui: {
          view: "label",
          unit: "kWh",
          step: 1,
          webIcon: "power"
        },
        cloud: ["measurement", "log"]
      }
    }
  }
];

function isNumber(value) {
  return typeof value === "number" &&
    value === value;
}

function numberOrZero(value) {
  if (isNumber(value)) {
    return value;
  }

  return 0;
}

function magnitudeOrZero(value) {
  return Math.abs(numberOrZero(value));
}

function validVoltage(value) {
  return isNumber(value) &&
    value >= MIN_VALID_VOLTAGE &&
    value <= MAX_VALID_VOLTAGE;
}

function validPowerFactorSetting(value) {
  return value === -1 ||
    (isNumber(value) &&
      value > 0 &&
      value <= 1);
}

function measuredPowerFactorFallback() {
  return (
    MIN_VALID_MEASURED_COS_PHI +
    MAX_VALID_MEASURED_COS_PHI
  ) / 2;
}

function capMeasuredPowerFactor(value) {
  if (!isNumber(value)) {
    return null;
  }

  if (value < MIN_VALID_MEASURED_COS_PHI) {
    return MIN_VALID_MEASURED_COS_PHI;
  }

  if (value > MAX_VALID_MEASURED_COS_PHI) {
    return MAX_VALID_MEASURED_COS_PHI;
  }

  return value;
}

function validPositiveIntervalMs(value) {
  return isNumber(value) &&
    value > 0;
}

// Effekt vises i hele watt.
function roundPower(value) {
  return Math.round(value * 1000);
}

// Energi vises uten desimaler.
function roundEnergy(value) {
  return Math.round(value);
}

function validateSettings() {
  if (!validPowerFactorSetting(ASSUMED_POWER_FACTOR)) {
    print("FEIL: ASSUMED_POWER_FACTOR må være -1 eller et tall større enn 0 og maks 1");
    return false;
  }

  if (!isNumber(CALIBRATION_FACTOR) ||
    CALIBRATION_FACTOR < 0) {
    print("FEIL: CALIBRATION_FACTOR må være et tall >= 0");
    return false;
  }

  if (!isNumber(INITIAL_ENERGY_KWH) ||
    INITIAL_ENERGY_KWH < 0) {
    print("FEIL: INITIAL_ENERGY_KWH må være et tall >= 0");
    return false;
  }

  if (!validPositiveIntervalMs(SAMPLE_INTERVAL_MS) ||
    !validPositiveIntervalMs(ENERGY_DISPLAY_INTERVAL_MS) ||
    !validPositiveIntervalMs(ENERGY_SAVE_INTERVAL_MS)) {
    print("FEIL: intervallene må være tall > 0");
    return false;
  }

  return true;
}

function setMode(mode) {
  if (mode !== lastMode) {
    lastMode = mode;
    print("Beregningsmetode:", mode);
  }
}

function restoreEnergy() {
  let stored = Script.storage.getItem(
    "energy_kwh"
  );

  if (stored === null) {
    return;
  }

  let restored;

  try {
    restored = JSON.parse(stored);
  } catch (error) {
    print(
      "Kunne ikke lese lagret energi:",
      error
    );

    return;
  }

  if (
    isNumber(restored) &&
    restored >= 0
  ) {
    energyKwh = restored;

    print(
      "Gjenopprettet energi:",
      energyKwh,
      "kWh"
    );
  }
}

function saveEnergy() {
  // Energien lagres med full presisjon.
  Script.storage.setItem(
    "energy_kwh",
    JSON.stringify(energyKwh)
  );

  lastSaveMs = Shelly.getUptimeMs();
}

function averageValues(values) {
  let sum = 0;

  if (values.length <= 0) {
    return null;
  }

  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
  }

  return sum / values.length;
}

function getAverageValidVoltage(em) {
  let voltages = [];

  if (validVoltage(em.a_voltage)) {
    voltages.push(em.a_voltage);
  }

  if (validVoltage(em.b_voltage)) {
    voltages.push(em.b_voltage);
  }

  if (validVoltage(em.c_voltage)) {
    voltages.push(em.c_voltage);
  }

  return averageValues(voltages);
}

function getAverageMeasuredPowerFactor(em) {
  let powerFactors = [];

  if (
    validVoltage(em.a_voltage) &&
    isNumber(em.a_pf)
  ) {
    powerFactors.push(
      capMeasuredPowerFactor(em.a_pf)
    );
  }

  if (
    validVoltage(em.b_voltage) &&
    isNumber(em.b_pf)
  ) {
    powerFactors.push(
      capMeasuredPowerFactor(em.b_pf)
    );
  }

  if (
    validVoltage(em.c_voltage) &&
    isNumber(em.c_pf)
  ) {
    powerFactors.push(
      capMeasuredPowerFactor(em.c_pf)
    );
  }

  return averageValues(powerFactors);
}

function resolveMeasuredPowerFactor(em) {
  let averagePowerFactor =
    getAverageMeasuredPowerFactor(em);

  if (averagePowerFactor === null) {
    if (!warnedPowerFactor) {
      print("Målt power factor mangler eller er ugyldig på faser med spenning, bruker gjennomsnitt av min/max");
      warnedPowerFactor = true;
    }

    return measuredPowerFactorFallback();
  }

  warnedPowerFactor = false;

  return capMeasuredPowerFactor(
    averagePowerFactor
  );
}

function resolvePhaseVoltage(
  measuredVoltage,
  fallbackVoltage
) {
  if (validVoltage(measuredVoltage)) {
    return measuredVoltage;
  }

  return fallbackVoltage;
}

function calculatePhasePowerKw(
  voltage,
  current,
  powerFactor
) {
  let phaseCurrent = magnitudeOrZero(current);

  if (
    !validVoltage(voltage) ||
    phaseCurrent <= 0 ||
    !isNumber(powerFactor)
  ) {
    return 0;
  }

  return voltage *
    phaseCurrent *
    powerFactor *
    CALIBRATION_FACTOR /
    1000;
}

function calculatePowerKw(em) {
  let fallbackVoltage =
    getAverageValidVoltage(em);

  if (!validVoltage(fallbackVoltage)) {
    setMode("Ingen gyldig spenning");
    return null;
  }

  let fallbackPowerFactor =
    ASSUMED_POWER_FACTOR;

  if (ASSUMED_POWER_FACTOR === -1) {
    fallbackPowerFactor =
      resolveMeasuredPowerFactor(em);
  }

  let powerA =
    calculatePhasePowerKw(
      resolvePhaseVoltage(
        em.a_voltage,
        fallbackVoltage
      ),
      em.a_current,
      fallbackPowerFactor
    );

  let powerB =
    calculatePhasePowerKw(
      resolvePhaseVoltage(
        em.b_voltage,
        fallbackVoltage
      ),
      em.b_current,
      fallbackPowerFactor
    );

  let powerC =
    calculatePhasePowerKw(
      resolvePhaseVoltage(
        em.c_voltage,
        fallbackVoltage
      ),
      em.c_current,
      fallbackPowerFactor
    );

  if (ASSUMED_POWER_FACTOR === -1) {
    setMode("Per fase med målt PF");
  } else {
    setMode(
      "Per fase med PF " +
      ASSUMED_POWER_FACTOR
    );
  }

  return powerA +
    powerB +
    powerC;
}

function sample() {
  let nowMs = Shelly.getUptimeMs();

  let elapsedHours =
    (nowMs - lastSampleMs) /
    3600000;

  lastSampleMs = nowMs;

  let em = Shelly.getComponentStatus(
    "em",
    0
  );

  if (em === null) {
    setMode(
      "Finner ikke em:0"
    );

    return;
  }

  let powerKw = calculatePowerKw(em);

  if (powerKw === null) {
    return;
  }

  // Bare importert energi legges til.
  if (
    elapsedHours > 0 &&
    elapsedHours < 1 &&
    powerKw > 0
  ) {
    energyKwh +=
      powerKw *
      elapsedHours;
  }

  // Effekt oppdateres hvert sekund.
  powerVc.setValue(
    roundPower(powerKw)
  );

  // Energi oppdateres hvert tiende sekund.
  if (
    nowMs - lastDisplayMs >=
    ENERGY_DISPLAY_INTERVAL_MS
  ) {
    energyVc.setValue(
      roundEnergy(energyKwh)
    );

    lastDisplayMs = nowMs;
  }

  // Full energiverdi lagres hvert minutt.
  if (
    nowMs - lastSaveMs >=
    ENERGY_SAVE_INTERVAL_MS
  ) {
    saveEnergy();
  }
}

function startCalculation() {
  if (calculationStarted) {
    return;
  }

  if (
    powerVc === null ||
    energyVc === null
  ) {
    print(
      "FEIL: virtuelle komponenter er ikke klare"
    );

    return;
  }

  calculationStarted = true;

  restoreEnergy();

  lastSampleMs =
    Shelly.getUptimeMs();

  lastDisplayMs =
    lastSampleMs;

  lastSaveMs =
    lastSampleMs;

  energyVc.setValue(
    roundEnergy(energyKwh)
  );

  sample();

  Timer.set(
    SAMPLE_INTERVAL_MS,
    true,
    sample
  );

  print(
    "IT-effektberegning startet"
  );
}

function saveComponentHandle(
  definition,
  componentKey
) {
  let handle = Virtual.getHandle(
    componentKey
  );

  if (handle === null) {
    print(
      "FEIL: kunne ikke åpne:",
      componentKey
    );

    return false;
  }

  if (definition.role === "power") {
    powerVc = handle;
  }

  if (definition.role === "energy") {
    energyVc = handle;
  }

  print(
    "Bruker virtuell komponent:",
    componentKey,
    definition.name
  );

  return true;
}

function findComponentByName(
  components,
  componentName
) {
  for (
    let i = 0;
    i < components.length;
    i += 1
  ) {
    let component =
      components[i];

    if (
      component.key === undefined ||
      component.config === undefined ||
      component.config === null
    ) {
      continue;
    }

    if (
      component.key.indexOf(
        "number:"
      ) !== 0
    ) {
      continue;
    }

    if (
      component.config.name ===
      componentName
    ) {
      return component.key;
    }
  }

  return null;
}

function createMissingComponents(
  definitions,
  index
) {
  if (index >= definitions.length) {
    startCalculation();
    return;
  }

  let definition =
    definitions[index];

  print(
    "Oppretter virtuell komponent:",
    definition.name
  );

  Shelly.call(
    "Virtual.Add",
    {
      type: definition.type,
      config: definition.config
    },
    function (
      result,
      errorCode,
      errorMessage
    ) {
      if (errorCode !== 0) {
        print(
          "FEIL ved opprettelse av:",
          definition.name,
          errorCode,
          errorMessage
        );

        return;
      }

      if (
        result === null ||
        result.id === undefined
      ) {
        print(
          "FEIL: Virtual.Add returnerte ugyldig svar for:",
          definition.name
        );

        return;
      }

      let componentKey =
        definition.type +
        ":" +
        result.id;

      print(
        "Opprettet virtuell komponent:",
        componentKey,
        definition.name
      );

      if (
        !saveComponentHandle(
          definition,
          componentKey
        )
      ) {
        return;
      }

      createMissingComponents(
        definitions,
        index + 1
      );
    }
  );
}

function findOrCreateVirtualComponents() {
  Shelly.call(
    "Shelly.GetComponents",
    {
      dynamic_only: true,
      include: ["config"]
    },
    function (
      result,
      errorCode,
      errorMessage
    ) {
      if (errorCode !== 0) {
        print(
          "FEIL ved søk etter virtuelle komponenter:",
          errorCode,
          errorMessage
        );

        return;
      }

      if (
        result === null ||
        result.components === undefined
      ) {
        print(
          "FEIL: ugyldig svar fra Shelly.GetComponents"
        );

        return;
      }

      let components =
        result.components;

      let missingComponents = [];

      for (
        let i = 0;
        i < VIRTUAL_COMPONENTS.length;
        i += 1
      ) {
        let definition =
          VIRTUAL_COMPONENTS[i];

        let componentKey =
          findComponentByName(
            components,
            definition.name
          );

        if (componentKey === null) {
          missingComponents.push(
            definition
          );

          continue;
        }

        saveComponentHandle(
          definition,
          componentKey
        );
      }

      if (missingComponents.length === 0) {
        print(
          "Alle virtuelle komponenter finnes allerede"
        );

        startCalculation();
        return;
      }

      print(
        "Antall manglende virtuelle komponenter:",
        missingComponents.length
      );

      createMissingComponents(
        missingComponents,
        0
      );
    }
  );
}

function initializeScript() {
  if (!validateSettings()) {
    return;
  }

  findOrCreateVirtualComponents();
}

initializeScript();
