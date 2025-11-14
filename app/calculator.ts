const SCALE_FACTOR = 10 ** 8.684670773;
const EXPONENT = -1.304556655;

// Enums become plain JS Objects
export const TireCasing = {
    THIN: 1.025,
    STANDARD: 1.0,
    REINFORCED: 0.95,
    DOUBLE: 0.9,
};

export const RideStyle = {
    CROSS: 0.6,
    GRAVEL: 0.9,
    XCOUNTRY_MTB: 0.9,
    ROAD: 1,
    FAT: 1,
    ENDURO_MTB: 1.05,
    TRAIL_MTB: 1.05,
    DOWNHILL_MTB: 1.1,
};

export const WheelPosition = {
    FRONT: 0.94,
    REAR: 1.0,
};

export const RimType = {
    TUBELESS_CROCHET: 1.03,
    TUBELESS_STRAIGHT_SIDE: 0.955,
    TUBES: 1.05,
};

export const Surface = {
    DRY: 1,
    SNOW: 0.5,
    WET: 0.9,
};

export const WheelDiameter = {
    '700C': 622,
    '650B': 584,
    '650C': 571,
};

const RIM_WIDTH_TIERS: number[][] = [
    // [maxTireWidth, innerRimWidth]
    [22, 15],
    [25, 17],
    [29, 19],
    [35, 21],
    [47, 23],
    [58, 25],
    [66, 30],
    [72, 35],
    [84, 45],
    [96, 55],
    [113, 76],
    [133, 94],
];

function getInnerRimWidth(tireWidth: number): number {
    if (tireWidth < 18) {
        throw new Error(`Invalid tire width: ${tireWidth}. Must be between 18 and 132.`);
    }

    for (const [maxTireWidth, innerRimWidth] of RIM_WIDTH_TIERS) {
        if (tireWidth < maxTireWidth) {
            return innerRimWidth;
        }
    }

    throw new Error(`Invalid tire width: ${tireWidth}. Must be between 18 and 132.`);
}

function convertKgToLbs(kg: number): number {
    return kg * 2.2046226218;
}

function AdjustTireWidth(tireWidth: number, innerRimWidth: number): number {
    return tireWidth + 0.4 * (innerRimWidth - getInnerRimWidth(tireWidth));
}

function calculateAirVolumeProxy(wheelDiameter: number, tireWidth: number): number {
    const majorRadius = wheelDiameter / 2 + tireWidth / 2;
    const minorRadius = tireWidth / 2;
    return 4 * Math.PI ** 2 * majorRadius * minorRadius;
}

export function calculateTirePressure(
    {
        systemWeight,
        wheelDiameter,
        tireWidth,
        innerRimWidth,
        tireCasing,
        rimType,
        rideStyle,
        surface,
        wheelPosition,
        adjustTireWidth = true,
        weightUnit = 'kg',
    }: {
        systemWeight: number;
        wheelDiameter: number;
        tireWidth: number;
        innerRimWidth: number;
        tireCasing: number;
        rimType: number;
        rideStyle: number;
        surface: number;
        wheelPosition: number;
        adjustTireWidth?: boolean;
        weightUnit?: string;
    }
): number {
    if (adjustTireWidth) {
        tireWidth = AdjustTireWidth(tireWidth, innerRimWidth);
    }
    if (weightUnit === 'kg') {
        systemWeight = convertKgToLbs(systemWeight);
    }

    return SCALE_FACTOR *
        calculateAirVolumeProxy(wheelDiameter, tireWidth) ** EXPONENT *
        (1 + (systemWeight - 180) * 0.0025) *
        wheelPosition *
        rimType *
        rideStyle *
        surface *
        tireCasing;
}