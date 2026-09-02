// Tittel: IT 3 fas energikalkulering målt 1 fas, 2ch - V2.1
// Shelly Pro EM-50
// Two separate, balanced three-phase loads on a 230 V IT network.
//
// Clamp A: em1:0
// Clamp B: em1:1
//
// One conductor is measured for each load.
// The current is assumed equal in all three conductors.
//
// P = sqrt(3) × U × I × power factor
// Endringslogg:
// V2: Changed how we display the names in virtual components.

// Type the desired name for each measured load here. Example "VVB K2" in NAME_B will create "VVB K2 - Effekt kalkulert (.2)"
let NAME_A = "VVB K1";
let NAME_B = "VVB K2";

// Resistive loads normally have a power factor close to 1.
let ASSUMED_POWER_FACTOR_A = 1.00;
let ASSUMED_POWER_FACTOR_B = 1.00;

// Adjust individually if comparison with another meter shows deviation.
let CALIBRATION_FACTOR_A = 1.00;
let CALIBRATION_FACTOR_B = 1.00;

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

let VIRTUAL_COMPONENTS = [
  {
    role: "power_a",
    name: NAME_A + " - Effekt kalkulert (.1)",
    type: "number",
    config: {
      name: NAME_A + " - Effekt kalkulert (.1)",
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
    name: NAME_A + " - Energi kalkulert (.1)",
    type: "number",
    config: {
      name: NAME_A + " - Energi kalkulert (.1)",
      min: 0,
      max: 1000000000,
      default_value: 0,
      persisted: true,
      meta: {
        ui: {
          view: "label",
          unit: "kWh",
          step: 1,
          icon: "power"
        }
      }
    }
  },
  {
    role: "power_b",
    name: NAME_B + " - Effekt kalkulert (.2)",
    type: "number",
    config: {
      name: NAME_B + " - Effekt kalkulert (.2)",
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
    name: NAME_B + " - Energi kalkulert (.2)",
    type: "number",
    config: {
      name: NAME_B + " - Energi kalkulert (.2)",
      min: 0,
      max: 1000000000,
      default_value: 0,
      persisted: true,
      meta: {
        ui: {
          view: "label",
          unit: "kWh",
          step: 1,
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

// Power is displayed in whole watts.
function roundPower(value) {
  return Math.round(value * 1000);
}

// Energy is displayed without decimals.
function roundEnergy(value) {
  return Math.round(value);
}

function validName(value) {
  return typeof value === "string" &&
    value.length > 0;
}

function validateNames() {
  if (
    !validName(NAME_A) ||
    !validName(NAME_B)
  ) {
    print(
      "ERROR: NAME_A and NAME_B must contain a name"
    );

    return false;
  }

  if (NAME_A === NAME_B) {
    print(
      "ERROR: NAME_A and NAME_B must be different"
    );

    return false;
  }

  return true;
}

function restoreStoredNumber(
  storageKey,
  fallbackValue
) {
  let stored = Script.storage.getItem(
    storageKey
  );

  if (stored === null) {
    return fallbackValue;
  }

  let restored;

  try {
    restored = JSON.parse(stored);
  } catch (error) {
    print(
      "Unable to read:",
      storageKey,
      error
    );

    return fallbackValue;
  }

  if (
    isNumber(restored) &&
    restored >= 0
  ) {
    return restored;
  }

  return fallbackValue;
}

function getPersistedComponentValue(
  component,
  fallbackValue
) {
  if (component === null) {
    return fallbackValue;
  }

  let value = component.getValue();

  if (
    isNumber(value) &&
    value >= 0
  ) {
    return value;
  }

  return fallbackValue;
}

function restoreEnergy() {
  // If script storage is empty, use the persisted virtual
  // component value as the fallback.
  let fallbackA =
    getPersistedComponentValue(
      energyVcA,
      INITIAL_ENERGY_A_KWH
    );

  let fallbackB =
    getPersistedComponentValue(
      energyVcB,
      INITIAL_ENERGY_B_KWH
    );

  energyAKwh = restoreStoredNumber(
    "energy_a_kwh",
    fallbackA
  );

  energyBKwh = restoreStoredNumber(
    "energy_b_kwh",
    fallbackB
  );

  print(
    "Restored energy A:",
    energyAKwh,
    "kWh"
  );

  print(
    "Restored energy B:",
    energyBKwh,
    "kWh"
  );
}

function saveEnergy() {
  // Full precision is saved in script storage.
  Script.storage.setItem(
    "energy_a_kwh",
    JSON.stringify(energyAKwh)
  );

  Script.storage.setItem(
    "energy_b_kwh",
    JSON.stringify(energyBKwh)
  );

  lastSaveMs = Shelly.getUptimeMs();
}

function selectVoltage(
  channelA,
  channelB
) {
  // Prefer voltage from channel A.
  if (
    channelA !== null &&
    validVoltage(channelA.voltage)
  ) {
    return channelA.voltage;
  }

  // Use voltage from channel B if A is unavailable.
  if (
    channelB !== null &&
    validVoltage(channelB.voltage)
  ) {
    return channelB.voltage;
  }

  return null;
}

function calculatePowerKw(
  voltage,
  current,
  powerFactor,
  calibrationFactor
) {
  if (!validVoltage(voltage)) {
    return null;
  }

  if (!validCurrent(current)) {
    return null;
  }

  return SQRT_3 *
    voltage *
    current *
    powerFactor *
    calibrationFactor /
    1000;
}

function sample() {
  let nowMs = Shelly.getUptimeMs();

  let elapsedHours =
    (nowMs - lastSampleMs) /
    3600000;

  lastSampleMs = nowMs;

  // Always use the default EM-50 channels:
  // em1:0 for channel .1 and em1:1 for channel .2.
  let channelA =
    Shelly.getComponentStatus(
      "em1",
      0
    );

  let channelB =
    Shelly.getComponentStatus(
      "em1",
      1
    );

  if (
    channelA === null &&
    channelB === null
  ) {
    print(
      "ERROR: Cannot find em1:0 or em1:1"
    );

    return;
  }

  // Both loads are assumed to have the same
  // phase-to-phase voltage.
  let commonVoltage =
    selectVoltage(
      channelA,
      channelB
    );

  if (commonVoltage === null) {
    print(
      "ERROR: No valid voltage is available"
    );

    return;
  }

  let powerAKw = null;
  let powerBKw = null;

  if (channelA !== null) {
    powerAKw = calculatePowerKw(
      commonVoltage,
      channelA.current,
      ASSUMED_POWER_FACTOR_A,
      CALIBRATION_FACTOR_A
    );
  }

  if (channelB !== null) {
    powerBKw = calculatePowerKw(
      commonVoltage,
      channelB.current,
      ASSUMED_POWER_FACTOR_B,
      CALIBRATION_FACTOR_B
    );
  }

  if (powerAKw !== null) {
    // Only imported energy is accumulated.
    if (
      elapsedHours > 0 &&
      elapsedHours < 1 &&
      powerAKw > 0
    ) {
      energyAKwh +=
        powerAKw *
        elapsedHours;
    }

    powerVcA.setValue(
      roundPower(powerAKw)
    );
  }

  if (powerBKw !== null) {
    // Only imported energy is accumulated.
    if (
      elapsedHours > 0 &&
      elapsedHours < 1 &&
      powerBKw > 0
    ) {
      energyBKwh +=
        powerBKw *
        elapsedHours;
    }

    powerVcB.setValue(
      roundPower(powerBKw)
    );
  }

  if (
    nowMs - lastDisplayMs >=
    ENERGY_DISPLAY_INTERVAL_MS
  ) {
    energyVcA.setValue(
      roundEnergy(energyAKwh)
    );

    energyVcB.setValue(
      roundEnergy(energyBKwh)
    );

    lastDisplayMs = nowMs;
  }

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
    powerVcA === null ||
    energyVcA === null ||
    powerVcB === null ||
    energyVcB === null
  ) {
    print(
      "ERROR: Virtual components are not ready"
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

  energyVcA.setValue(
    roundEnergy(energyAKwh)
  );

  energyVcB.setValue(
    roundEnergy(energyBKwh)
  );

  sample();

  Timer.set(
    SAMPLE_INTERVAL_MS,
    true,
    sample
  );

  print(
    "EM-50 three-phase IT calculation started"
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
      "ERROR: Unable to open:",
      componentKey
    );

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

  print(
    "Using virtual component:",
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
    "Creating virtual component:",
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
          "ERROR creating:",
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
          "ERROR: Invalid response from Virtual.Add:",
          definition.name
        );

        return;
      }

      let componentKey =
        definition.type +
        ":" +
        result.id;

      print(
        "Created virtual component:",
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
          "ERROR finding virtual components:",
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
          "ERROR: Invalid Shelly.GetComponents response"
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
          "All virtual components already exist"
        );

        startCalculation();
        return;
      }

      print(
        "Missing virtual components:",
        missingComponents.length
      );

      createMissingComponents(
        missingComponents,
        0
      );
    }
  );
}

if (validateNames()) {
  findOrCreateVirtualComponents();
}
