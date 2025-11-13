"use client";

import React, {useState, useMemo, ReactElement, useEffect, useRef} from "react";
import {
    calculateTirePressure,
    RideStyle,
    TireCasing,
    RimType,
    Surface,
    WheelPosition,
} from "./calculator";

type State = {
    rideStyle: number,
    tireCasing: number,
    rimType: number,
    surface: number,
    tireWidth: number,
    innerRimWidth: number,
    wheelDiameter: number,
    systemWeight: number,
};

const defaultState: State = {
    rideStyle: RideStyle.ROAD,
    tireCasing: TireCasing.STANDARD,
    rimType: RimType.TUBELESS_CROCHET,
    surface: Surface.DRY,
    tireWidth: 34,
    innerRimWidth: 23,
    wheelDiameter: 622,
    systemWeight: 97.5,
};

const LOCAL_STORAGE_KEY = "pressureGuideState";

function getInitialState(): State {
    // Always return deterministic defaults for SSR. Load saved state after mount.
    return defaultState;
}

// Helper component to build our dropdowns
function EnumSelect({label, value, onChange, enumObject}: {
    label: string,
    value: number,
    onChange: (value: number) => void,
    enumObject: Record<string, number>
}) {
    return (
        <label>
            {label}
            <select value={value}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(parseFloat(e.currentTarget.value))}>
                {Object.entries(enumObject).map(([name, val]) => (
                    <option key={name} value={val}>
                        {name}
                    </option>
                ))}
            </select>
        </label>
    );
}

// Helper component for number inputs
function NumberInput({label, value, onChange}: {
    label: string,
    value: number,
    onChange: (value: number) => void,
}): ReactElement {
    return (
        <label>
            {label}
            <input
                type="number"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.currentTarget.value) || 0)}
                step="0.1"
            />
        </label>
    );
}

export default function Home() {
    // --- 3. Use ONE useState hook, initialized from our function ---
    const [state, setState] = useState(getInitialState);

    // Load saved state once after mount to avoid SSR/client mismatch
    const hasLoadedRef = useRef(false);
    useEffect(() => {
        try {
            const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                setState(prev => ({...prev, ...parsed}));
            }
        } catch (e) {
            console.error("Failed to parse saved state", e);
        } finally {
            hasLoadedRef.current = true;
        }
    }, []);

    // Save state after changes, but only after initial load completed
    useEffect(() => {
        if (!hasLoadedRef.current) return;
        try {
            const stateToSave = JSON.stringify(state);
            localStorage.setItem(LOCAL_STORAGE_KEY, stateToSave);
        } catch (e) {
            console.error("Failed to save state", e);
        }
    }, [state]);
    // Helper to update the single state object
    const handleChange = (key: string, value: number): void => {
        setState(prevState => ({
            ...prevState,
            [key]: value,
        }));
    };
    
    const pressures = useMemo(() => {
        const front = calculateTirePressure({
            ...state,
            wheelPosition: WheelPosition.FRONT,
        });

        const rear = calculateTirePressure({
            ...state,
            wheelPosition: WheelPosition.REAR,
        });

        return {front, rear};
    }, [state]);

    return (
        <main className="container">
            <h1>Tire Pressure Calculator</h1>

            <div className="results">
                <div className="result-box">
                    <h2>Front</h2>
                    <p>{pressures.front.toFixed(1)} PSI</p>
                </div>
                <div className="result-box">
                    <h2>Rear</h2>
                    <p>{pressures.rear.toFixed(1)} PSI</p>
                </div>
            </div>

            <div className="form">
                <h3>System</h3>
                <NumberInput
                    label="System Weight (kg)"
                    value={state.systemWeight}
                    onChange={value => handleChange('systemWeight', value)}
                />
                <NumberInput
                    label="Tire Width (mm)"
                    value={state.tireWidth}
                    onChange={value => handleChange('tireWidth', value)}
                />
                <NumberInput
                    label="Inner Rim Width (mm)"
                    value={state.innerRimWidth}
                    onChange={value => handleChange('innerRimWidth', value)}
                />
                <NumberInput
                    label="Wheel Diameter (mm)"
                    value={state.wheelDiameter}
                    onChange={value => handleChange('wheelDiameter', value)}
                />

                <h3>Conditions</h3>
                <EnumSelect
                    label="Ride Style"
                    value={state.rideStyle}
                    onChange={value => handleChange('rideStyle', value)}
                    enumObject={RideStyle}
                />
                <EnumSelect
                    label="Tire Casing"
                    value={state.tireCasing}
                    onChange={value => handleChange('tireCasing', value)}
                    enumObject={TireCasing}
                />
                <EnumSelect
                    label="Rim Type"
                    value={state.rimType}
                    onChange={value => handleChange('rimType', value)}
                    enumObject={RimType}
                />
                <EnumSelect
                    label="Surface"
                    value={state.surface}
                    onChange={value => handleChange('surface', value)}
                    enumObject={Surface}
                />
            </div>

            <div className="footer-bar">
            </div>

            <div className="disclaimer-footer">
                <p>
                    This is an <strong>unofficial</strong> tool. The calculation logic is
                    based on the original <a
                    href="https://axs.sram.com/guides/tire/pressure"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    SRAM AXS Tire Pressure Guide
                </a>.
                </p>
                <p>
                    This tool is not affiliated with, endorsed by, or associated with
                    SRAM, LLC in any way. Use at your own risk.
                </p>
            </div>
        </main>
    );
}
