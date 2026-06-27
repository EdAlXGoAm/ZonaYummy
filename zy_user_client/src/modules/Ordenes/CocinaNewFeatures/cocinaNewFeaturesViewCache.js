const COMPACT_COLUMNS_KEY = 'zy-cocina-nf-compact-columns';
const SPACE_CONFIG_KEY = 'zy-cocina-nf-space-config';
const ACTIVE_COMANDAS_CACHE_KEY = 'zy-cocina-nf-active-comandas-cache';
const ACTIVE_COMANDAS_CACHE_TTL_MS = 15 * 60 * 1000;

export const loadCompactColumnsPreference = () => {
    try {
        return localStorage.getItem(COMPACT_COLUMNS_KEY) === '1';
    } catch {
        return false;
    }
};

export const saveCompactColumnsPreference = (enabled) => {
    try {
        localStorage.setItem(COMPACT_COLUMNS_KEY, enabled ? '1' : '0');
    } catch {
        // ignore quota / private mode
    }
};

const getSafeNumber = (value, fallback) => (
    Number.isFinite(Number(value)) ? Number(value) : fallback
);

export const loadKitchenSpaceConfig = (defaults) => {
    try {
        const raw = localStorage.getItem(SPACE_CONFIG_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return defaults;

        return {
            ...defaults,
            ...parsed,
            defaultComanda: getSafeNumber(parsed.defaultComanda, defaults.defaultComanda),
            tacoDeBirria: getSafeNumber(parsed.tacoDeBirria, defaults.tacoDeBirria),
            additionalOrderHeader: getSafeNumber(
                parsed.additionalOrderHeader,
                defaults.additionalOrderHeader,
            ),
            platillos: {
                ...defaults.platillos,
                ...(parsed.platillos || {}),
                Hamburguesa: getSafeNumber(
                    parsed.platillos?.Hamburguesa,
                    defaults.platillos.Hamburguesa,
                ),
                'Hamburguesa con papas': getSafeNumber(
                    parsed.platillos?.['Hamburguesa con papas'],
                    defaults.platillos['Hamburguesa con papas'],
                ),
                Tacos: getSafeNumber(parsed.platillos?.Tacos, defaults.platillos.Tacos),
                'Alitas a la BBQ': getSafeNumber(
                    parsed.platillos?.['Alitas a la BBQ'],
                    defaults.platillos['Alitas a la BBQ'],
                ),
                'Alitas a la BBQ con papas': getSafeNumber(
                    parsed.platillos?.['Alitas a la BBQ con papas'],
                    defaults.platillos['Alitas a la BBQ con papas'],
                ),
                'Alitas a la BBQ sin papas': getSafeNumber(
                    parsed.platillos?.['Alitas a la BBQ sin papas'],
                    defaults.platillos['Alitas a la BBQ sin papas'],
                ),
                'C Hamburguesa': getSafeNumber(
                    parsed.platillos?.['C Hamburguesa'],
                    defaults.platillos['C Hamburguesa'],
                ),
            },
        };
    } catch {
        return defaults;
    }
};

export const saveKitchenSpaceConfig = (config) => {
    try {
        localStorage.setItem(SPACE_CONFIG_KEY, JSON.stringify(config));
    } catch {
        // ignore quota / private mode
    }
};

export const loadActiveComandasCache = () => {
    try {
        const raw = localStorage.getItem(ACTIVE_COMANDAS_CACHE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.comandas)) {
            localStorage.removeItem(ACTIVE_COMANDAS_CACHE_KEY);
            return [];
        }

        if (!Number.isFinite(parsed.savedAt) || Date.now() - parsed.savedAt > ACTIVE_COMANDAS_CACHE_TTL_MS) {
            localStorage.removeItem(ACTIVE_COMANDAS_CACHE_KEY);
            return [];
        }

        return parsed.comandas;
    } catch {
        try {
            localStorage.removeItem(ACTIVE_COMANDAS_CACHE_KEY);
        } catch {
            // ignore
        }
        return [];
    }
};

export const saveActiveComandasCache = (comandas) => {
    try {
        localStorage.setItem(ACTIVE_COMANDAS_CACHE_KEY, JSON.stringify({
            savedAt: Date.now(),
            comandas: Array.isArray(comandas) ? comandas : [],
        }));
    } catch {
        // ignore quota / private mode
    }
};
