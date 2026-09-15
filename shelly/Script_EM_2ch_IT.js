// Setup variables
let NAME_A = "VVB K1";
let NAME_B = "VVB K2";

// Select 2 or 3 for each channel.
let PHASE_MODE_A = 3;
let PHASE_MODE_B = 3;

// -1 = use measured cos phi.
// Example 1.00 = use assumed cos phi.
let COS_PHI_A = 1.00;
let COS_PHI_B = 1.00;

let CALIBRATION_FACTOR_A = 1.00;
let CALIBRATION_FACTOR_B = 1.00;

// Tittel: IT 2ch energikalk (2-fas/3-fas per kanal) - V1
// Shelly Pro EM-50
//
// Two separate loads on a 230 V IT network.
// One conductor is measured for each load.
// Example: NAME_B = "VVB K2" creates "VVB K2 - Effekt kalkulert (ch2)".
//
// Per channel you can choose:
// - 2-phase estimate: P = U × I × cos phi
// - 3-phase balanced estimate: P = sqrt(3) × U × I × cos phi
//
// cos phi setting per channel:
// - Use -1 to use measured cos phi from the EM channel
// - Use a fixed value like 1.00 to assume cos phi
//
// IMPORTANT:
// If you use a fixed cos phi value, cos phi is assumed/estimated, not measured.
// Changelog:
// V1 - 15.09.2026: Opprettet
let INITIAL_ENERGY_A_KWH = 0.0;
let INITIAL_ENERGY_B_KWH = 0.0;

let SAMPLE_INTERVAL_MS = 1000;
let ENERGY_DISPLAY_INTERVAL_MS = 10000;
let ENERGY_SAVE_INTERVAL_MS = 60000;

let MIN_VALID_VOLTAGE = 100;
let MAX_VALID_VOLTAGE = 280;
let SQRT_3 = 1.7320508075688772;

let powerVcA = null;
let energyVcA = null;
let powerVcB = null;
let energyVcB = null;

let energyAKwh = INITIAL_ENERGY_A_KWH;
let energyBKwh = INITIAL_ENERGY_B_KWH;

let lastSampleMs = 0;
let lastDisplayMs = 0;
let lastSaveMs = 0;

let calculationStarted = false;
let warnedCosPhiA = false;
let warnedCosPhiB = false;

let VIRTUAL_COMPONENTS = [
  {
    role: "power_a",
    name: NAME_A + " - Effekt kalkulert (ch1)",
    type: "number",
    config: {
      name: NAME_A + " - Effekt kalkulert (ch1)",
      min: 0,
      max: 100000,
      default_value: 0,
      persisted: false,
      meta: {
        ui: {
          view: "label",
          unit: "W",
          step: 1,
          icon: "power"
        }
      }
    }
  },
  {
    role: "energy_a",
    name: NAME_A + " - Energi kalkulert (ch1)",
    type: "number",
    config: {
      name: NAME_A + " - Energi kalkulert (ch1)",
      min: 0,
      max: 1000000000,
      default_value: 0,
      persisted: true,
      meta: {
        ui: {
          view: "label",
          unit: "kWh",
          step: 0.001,
          icon: "power"
        }
      }
    }
  },
  {
    role: "power_b",
    name: NAME_B + " - Effekt kalkulert (ch2)",
    type: "number",
    config: {
      name: NAME_B + " - Effekt kalkulert (ch2)",
      min: 0,
      max: 100000,
      default_value: 0,
      persisted: false,
      meta: {
        ui: {
          view: "label",
          unit: "W",
          step: 1,
          icon: "power"
        }
      }
    }
  },
  {
    role: "energy_b",
    name: NAME_B + " - Energi kalkulert (ch2)",
    type: "number",
    config: {
      name: NAME_B + " - Energi kalkulert (ch2)",
      min: 0,
      max: 1000000000,
      default_value: 0,
      persisted: true,
      meta: {
        ui: {
          view: "label",
          unit: "kWh",
          step: 0.001,
          icon: "power"
        }
      }
    }
  }
];

function isNumber(value) {
  return typeof value === "number" &&
    value === value;
}

function validVoltage(value) {
  return isNumber(value) &&
    value >= MIN_VALID_VOLTAGE &&
    value <= MAX_VALID_VOLTAGE;
}

function validCurrent(value) {
  return isNumber(value) &&
    value >= 0;
}

function validPhaseMode(value) {
  return value === 2 ||
    value === 3;
}

function validConfiguredCosPhi(value) {
  return value === -1 ||
    (isNumber(value) && value >= 0 && value <= 1);
}

function validMeasuredCosPhi(value) {
  return isNumber(value) &&
    value >= 0 &&
    value <= 1;
}

function validPositiveIntervalMs(value) {
  return isNumber(value) &&
    value > 0;
}

function convertPowerKwToW(value) {
  return value * 1000;
}

function roundEnergyKwh(value) {
  return Math.round(value * 1000) / 1000;
}

function validName(value) {
  return typeof value === "string" &&
    value.length > 0;
}

function validateSettings() {
  if (!validName(NAME_A) || !validName(NAME_B)) {
    print("ERROR: NAME_A and NAME_B must contain a name");
    return false;
  }

  if (NAME_A === NAME_B) {
    print("ERROR: NAME_A and NAME_B must be different");
    return false;
  }

  if (!validPhaseMode(PHASE_MODE_A) || !validPhaseMode(PHASE_MODE_B)) {
    print("ERROR: PHASE_MODE_A and PHASE_MODE_B must be 2 or 3");
    return false;
  }

  if (!validConfiguredCosPhi(COS_PHI_A) || !validConfiguredCosPhi(COS_PHI_B)) {
    print("ERROR: COS_PHI_A and COS_PHI_B must be -1 or a number between 0 and 1");
    return false;
  }

  if (
    !isNumber(CALIBRATION_FACTOR_A) ||
    !isNumber(CALIBRATION_FACTOR_B) ||
    CALIBRATION_FACTOR_A < 0 ||
    CALIBRATION_FACTOR_B < 0
  ) {
    print("ERROR: CALIBRATION_FACTOR_A and CALIBRATION_FACTOR_B must be numbers >= 0");
    return false;
  }

  if (
    !isNumber(INITIAL_ENERGY_A_KWH) ||
    !isNumber(INITIAL_ENERGY_B_KWH) ||
    INITIAL_ENERGY_A_KWH < 0 ||
    INITIAL_ENERGY_B_KWH < 0
  ) {
    print("ERROR: INITIAL_ENERGY_A_KWH and INITIAL_ENERGY_B_KWH must be numbers >= 0");
    return false;
  }

  if (
    !validPositiveIntervalMs(SAMPLE_INTERVAL_MS) ||
    !validPositiveIntervalMs(ENERGY_DISPLAY_INTERVAL_MS) ||
    !validPositiveIntervalMs(ENERGY_SAVE_INTERVAL_MS)
  ) {
    print("ERROR: SAMPLE_INTERVAL_MS, ENERGY_DISPLAY_INTERVAL_MS and ENERGY_SAVE_INTERVAL_MS must be > 0");
    return false;
  }

  return true;
}

function restoreStoredNumber(storageKey, fallbackValue) {
  let stored = Script.storage.getItem(storageKey);

  if (
    stored === null ||
    stored === undefined
  ) {
    return fallbackValue;
  }

  let restored;

  try {
    restored = JSON.parse(stored);
  } catch (error) {
    print("Unable to read:", storageKey, error);
    return fallbackValue;
  }

  if (isNumber(restored) && restored >= 0) {
    return restored;
  }

  return fallbackValue;
}

function getPersistedComponentValue(component, fallbackValue) {
  if (component === null) {
    return fallbackValue;
  }

  let value = component.getValue();

  if (isNumber(value) && value >= 0) {
    return value;
  }

  return fallbackValue;
}

function restoreEnergy() {
  let fallbackA = getPersistedComponentValue(energyVcA, INITIAL_ENERGY_A_KWH);
  let fallbackB = getPersistedComponentValue(energyVcB, INITIAL_ENERGY_B_KWH);

  energyAKwh = restoreStoredNumber("energy_a_kwh", fallbackA);
  energyBKwh = restoreStoredNumber("energy_b_kwh", fallbackB);

  print("Restored energy A:", energyAKwh, "kWh");
  print("Restored energy B:", energyBKwh, "kWh");
}

function saveEnergy() {
  Script.storage.setItem("energy_a_kwh", JSON.stringify(energyAKwh));
  Script.storage.setItem("energy_b_kwh", JSON.stringify(energyBKwh));

  lastSaveMs = Shelly.getUptimeMs();
}

function resolveCosPhi(channel, configuredCosPhi, channelLabel) {
  if (configuredCosPhi !== -1) {
    return configuredCosPhi;
  }

  if (channel !== null && validMeasuredCosPhi(channel.cosphi)) {
    if (channelLabel === "A") {
      warnedCosPhiA = false;
    }

    if (channelLabel === "B") {
      warnedCosPhiB = false;
    }

    return channel.cosphi;
  }

  if (channelLabel === "A" && !warnedCosPhiA) {
    print("WARNING: Channel A measured cos phi is invalid/missing");
    warnedCosPhiA = true;
  }

  if (channelLabel === "B" && !warnedCosPhiB) {
    print("WARNING: Channel B measured cos phi is invalid/missing");
    warnedCosPhiB = true;
  }

  return null;
}

function calculatePowerKw(phaseMode, voltage, current, cosPhi, calibrationFactor) {
  if (!validVoltage(voltage) || !validCurrent(current) || !isNumber(cosPhi)) {
    return null;
  }

  if (phaseMode === 2) {
    return voltage * current * cosPhi * calibrationFactor / 1000;
  }

  if (phaseMode === 3) {
    return SQRT_3 * voltage * current * cosPhi * calibrationFactor / 1000;
  }

  return null;
}

function updateChannel(channel, phaseMode, configuredCosPhi, calibrationFactor, channelLabel) {
  if (channel === null) {
    return null;
  }

  let resolvedCosPhi = resolveCosPhi(channel, configuredCosPhi, channelLabel);

  if (resolvedCosPhi === null) {
    return null;
  }

  return calculatePowerKw(
    phaseMode,
    channel.voltage,
    channel.current,
    resolvedCosPhi,
    calibrationFactor
  );
}

function sample() {
  let nowMs = Shelly.getUptimeMs();
  let elapsedHours = (nowMs - lastSampleMs) / 3600000;
  lastSampleMs = nowMs;

  let channelA = Shelly.getComponentStatus("em1", 0);
  let channelB = Shelly.getComponentStatus("em1", 1);

  if (channelA === null && channelB === null) {
    print("ERROR: Cannot find em1:0 or em1:1");
    return;
  }

  let powerAKw = updateChannel(
    channelA,
    PHASE_MODE_A,
    COS_PHI_A,
    CALIBRATION_FACTOR_A,
    "A"
  );

  let powerBKw = updateChannel(
    channelB,
    PHASE_MODE_B,
    COS_PHI_B,
    CALIBRATION_FACTOR_B,
    "B"
  );

  if (powerAKw !== null) {
    if (elapsedHours > 0 && elapsedHours < 1 && powerAKw > 0) {
      energyAKwh += powerAKw * elapsedHours;
    }

    powerVcA.setValue(convertPowerKwToW(powerAKw));
  } else {
    powerVcA.setValue(0);
  }

  if (powerBKw !== null) {
    if (elapsedHours > 0 && elapsedHours < 1 && powerBKw > 0) {
      energyBKwh += powerBKw * elapsedHours;
    }

    powerVcB.setValue(convertPowerKwToW(powerBKw));
  } else {
    powerVcB.setValue(0);
  }

  if (nowMs - lastDisplayMs >= ENERGY_DISPLAY_INTERVAL_MS) {
    energyVcA.setValue(roundEnergyKwh(energyAKwh));
    energyVcB.setValue(roundEnergyKwh(energyBKwh));
    lastDisplayMs = nowMs;
  }

  if (nowMs - lastSaveMs >= ENERGY_SAVE_INTERVAL_MS) {
    saveEnergy();
  }
}

function startCalculation() {
  if (calculationStarted) {
    return;
  }

  if (powerVcA === null || energyVcA === null || powerVcB === null || energyVcB === null) {
    print("ERROR: Virtual components are not ready");
    return;
  }

  calculationStarted = true;
  restoreEnergy();

  lastSampleMs = Shelly.getUptimeMs();
  lastDisplayMs = lastSampleMs;
  lastSaveMs = lastSampleMs;

  energyVcA.setValue(roundEnergyKwh(energyAKwh));
  energyVcB.setValue(roundEnergyKwh(energyBKwh));

  sample();
  Timer.set(SAMPLE_INTERVAL_MS, true, sample);

  print("EM-50 2ch IT calculation started");
}

function saveComponentHandle(definition, componentKey) {
  let handle = Virtual.getHandle(componentKey);

  if (handle === null) {
    print("ERROR: Unable to open:", componentKey);
    return false;
  }

  if (definition.role === "power_a") {
    powerVcA = handle;
  }

  if (definition.role === "energy_a") {
    energyVcA = handle;
  }

  if (definition.role === "power_b") {
    powerVcB = handle;
  }

  if (definition.role === "energy_b") {
    energyVcB = handle;
  }

  print("Using virtual component:", componentKey, definition.name);
  return true;
}

function findComponentByName(components, componentName) {
  for (let i = 0; i < components.length; i += 1) {
    let component = components[i];

    if (component.key === undefined || component.config === undefined || component.config === null) {
      continue;
    }

    if (component.key.indexOf("number:") !== 0) {
      continue;
    }

    if (component.config.name === componentName) {
      return component.key;
    }
  }

  return null;
}

function createMissingComponents(definitions, index) {
  if (index >= definitions.length) {
    startCalculation();
    return;
  }

  let definition = definitions[index];

  print("Creating virtual component:", definition.name);

  Shelly.call(
    "Virtual.Add",
    {
      type: definition.type,
      config: definition.config
    },
    function (result, errorCode, errorMessage) {
      if (errorCode !== 0) {
        print("ERROR creating:", definition.name, errorCode, errorMessage);
        return;
      }

      if (result === null || result.id === undefined) {
        print("ERROR: Invalid response from Virtual.Add:", definition.name);
        return;
      }

      let componentKey = definition.type + ":" + result.id;

      print("Created virtual component:", componentKey, definition.name);

      if (!saveComponentHandle(definition, componentKey)) {
        return;
      }

      createMissingComponents(definitions, index + 1);
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
    function (result, errorCode, errorMessage) {
      if (errorCode !== 0) {
        print("ERROR finding virtual components:", errorCode, errorMessage);
        return;
      }

      if (result === null || result.components === undefined) {
        print("ERROR: Invalid Shelly.GetComponents response");
        return;
      }

      let components = result.components;
      let missingComponents = [];

      for (let i = 0; i < VIRTUAL_COMPONENTS.length; i += 1) {
        let definition = VIRTUAL_COMPONENTS[i];

        let componentKey = findComponentByName(components, definition.name);

        if (componentKey === null) {
          missingComponents.push(definition);
          continue;
        }

        saveComponentHandle(definition, componentKey);
      }

      if (missingComponents.length === 0) {
        print("All virtual components already exist");
        startCalculation();
        return;
      }

      print("Missing virtual components:", missingComponents.length);
      createMissingComponents(missingComponents, 0);
    }
  );
}

if (validateSettings()) {
  findOrCreateVirtualComponents();
}
