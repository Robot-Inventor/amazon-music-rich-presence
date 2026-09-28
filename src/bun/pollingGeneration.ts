let pollingGeneration = 0;

const advancePollingGeneration = (): number => {
    ++pollingGeneration;
    return pollingGeneration;
};

const isActivePollingGeneration = (generation: number): boolean => generation === pollingGeneration;

export { advancePollingGeneration, isActivePollingGeneration };
