// Setup variables

// -1 = use measured cos phi.
// Example 1.00 = use assumed power factor.
let ASSUMED_POWER_FACTOR = 0.90;

let CALIBRATION_FACTOR = 0.90;

// Tittel: IT 3 fas energikalkulering målt 2 faser - V2.2
// Link: https://github.com/surematu/WebHomeHelpFiles/edit/main/shelly/Script_EM_IT_3_fas_strømmåling_energi.js
// Shelly Pro 3EM - beregnet effekt og energi for 230 V IT-nett
// Virtuelle komponenter opprettes automatisk dersom de mangler.
// Komponentene finnes og brukes etter navn.
// Changelog:
// V2 - 02.09.2026: Endret fra kw til w på effekt
// V2.1 - 16.09.2026: Flyttet oppsettvariabler og gjorde EM/navn statiske.
// V2.2 - 20.09.2026: Cosphi min, max valid added.

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
let SQRT_3 = 1.7320508075688772;

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

function validMeasuredPowerFactor(value) {
  return isNumber(value) &&
    value >= MIN_VALID_MEASURED_COS_PHI &&
    value <= MAX_VALID_MEASURED_COS_PHI;
}

function measuredPowerFactorFallback() {
  return (
    MIN_VALID_MEASURED_COS_PHI +
    MAX_VALID_MEASURED_COS_PHI
  ) / 2;
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

function addMeasuredPowerFactor(
  weightedPowerFactor,
  validPowerFactorCurrent,
  current,
  powerFactor
) {
  if (current <= 0 ||
    !validMeasuredPowerFactor(powerFactor)) {
    return {
      weightedPowerFactor: weightedPowerFactor,
      validPowerFactorCurrent:
        validPowerFactorCurrent
    };
  }

  return {
    weightedPowerFactor:
      weightedPowerFactor +
      current * powerFactor,
    validPowerFactorCurrent:
      validPowerFactorCurrent +
      current
  };
}

function resolvePowerFactor(em) {
  if (ASSUMED_POWER_FACTOR !== -1) {
    return ASSUMED_POWER_FACTOR;
  }

  let weightedPowerFactor = 0;
  let validPowerFactorCurrent = 0;
  let phasePowerFactor;

  phasePowerFactor = addMeasuredPowerFactor(
    weightedPowerFactor,
    validPowerFactorCurrent,
    numberOrZero(em.a_current),
    em.a_pf
  );
  weightedPowerFactor =
    phasePowerFactor.weightedPowerFactor;
  validPowerFactorCurrent =
    phasePowerFactor.validPowerFactorCurrent;

  phasePowerFactor = addMeasuredPowerFactor(
    weightedPowerFactor,
    validPowerFactorCurrent,
    numberOrZero(em.b_current),
    em.b_pf
  );
  weightedPowerFactor =
    phasePowerFactor.weightedPowerFactor;
  validPowerFactorCurrent =
    phasePowerFactor.validPowerFactorCurrent;

  phasePowerFactor = addMeasuredPowerFactor(
    weightedPowerFactor,
    validPowerFactorCurrent,
    numberOrZero(em.c_current),
    em.c_pf
  );
  weightedPowerFactor =
    phasePowerFactor.weightedPowerFactor;
  validPowerFactorCurrent =
    phasePowerFactor.validPowerFactorCurrent;

  if (validPowerFactorCurrent <= 0) {
    if (!warnedPowerFactor) {
      print("Målt power factor mangler eller er ugyldig, bruker gjennomsnitt av min/max");
      warnedPowerFactor = true;
    }

    return measuredPowerFactorFallback();
  }

  warnedPowerFactor = false;

  return weightedPowerFactor /
    validPowerFactorCurrent;
}

function calculatePowerKw(em) {
  let aVoltageValid =
    validVoltage(em.a_voltage);

  let bVoltageValid =
    validVoltage(em.b_voltage);

  let cVoltageValid =
    validVoltage(em.c_voltage);

  let validVoltageCount = 0;

  if (aVoltageValid) {
    validVoltageCount += 1;
  }

  if (bVoltageValid) {
    validVoltageCount += 1;
  }

  if (cVoltageValid) {
    validVoltageCount += 1;
  }

  // Dersom to eller tre spenninger er tilgjengelige,
  // brukes Shellys målte aktive effekt.
  if (validVoltageCount >= 2) {
    let activePowerW = 0;

    if (aVoltageValid) {
      activePowerW +=
        numberOrZero(em.a_act_power);
    }

    if (bVoltageValid) {
      activePowerW +=
        numberOrZero(em.b_act_power);
    }

    if (cVoltageValid) {
      activePowerW +=
        numberOrZero(em.c_act_power);
    }

    if (validVoltageCount === 2) {
      setMode("To-wattmetermetoden");
    } else {
      setMode("Tre spenningskanaler");
    }

    return activePowerW *
      CALIBRATION_FACTOR /
      1000;
  }

  // Med én tilgjengelig linjespenning brukes:
  //
  // P = U × (IA + IB + IC) / sqrt(3) × antatt PF

  let lineVoltage = 0;

  if (aVoltageValid) {
    lineVoltage = em.a_voltage;
  }

  if (bVoltageValid) {
    lineVoltage = em.b_voltage;
  }

  if (cVoltageValid) {
    lineVoltage = em.c_voltage;
  }

  if (lineVoltage === 0) {
    setMode("Ingen gyldig spenning");
    return null;
  }

  let totalCurrent =
    numberOrZero(em.a_current) +
    numberOrZero(em.b_current) +
    numberOrZero(em.c_current);

  let apparentPowerKva =
    lineVoltage *
    totalCurrent /
    SQRT_3 /
    1000;

  let powerFactor =
    resolvePowerFactor(em);

  if (powerFactor === null) {
    setMode("Ingen gyldig power factor");
    return null;
  }

  if (ASSUMED_POWER_FACTOR === -1) {
    setMode("Estimat med målt PF");
  } else {
    setMode(
      "Estimat med PF " +
      ASSUMED_POWER_FACTOR
    );
  }

  return apparentPowerKva *
    powerFactor *
    CALIBRATION_FACTOR;
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
