// ========== CONFIGURACIÓN DE LOGGING DE RENDIMIENTO ==========
// Este archivo centraliza la configuración de logs de rendimiento
// Cambiar estas configuraciones afecta toda la aplicación

const PERFORMANCE_CONFIG = {
    // PRODUCCIÓN: Cambiar todo a false para máximo rendimiento
    ENABLE_DETAILED_LOGS: false,   // true = logs verbosos, false = solo logs críticos
    ENABLE_VISUAL_STATS: true,     // true = mostrar stats visuales en UI, false = ocultar
    ENABLE_CONSOLE_TIME: false,    // true = usar console.time, false = solo performance.now
    
    // DESARROLLO: Para debug temporal cambiar esto a true
    ENABLE_DEV_MODE: false,        // true = activa todos los logs temporalmente
};

// Modo desarrollo sobreescribe todo para facilitar debugging
if (PERFORMANCE_CONFIG.ENABLE_DEV_MODE) {
    PERFORMANCE_CONFIG.ENABLE_DETAILED_LOGS = true;
    PERFORMANCE_CONFIG.ENABLE_CONSOLE_TIME = true;
    PERFORMANCE_CONFIG.ENABLE_VISUAL_STATS = true;
}

// Sistema de logging inteligente
const performanceLogger = {
    // Logs detallados que se pueden desactivar
    log: (message, ...args) => {
        if (PERFORMANCE_CONFIG.ENABLE_DETAILED_LOGS) {
            console.log(message, ...args);
        }
    },
    
    // Console.time que se puede desactivar para ahorrar rendimiento
    time: (label) => {
        if (PERFORMANCE_CONFIG.ENABLE_CONSOLE_TIME) {
            console.time(label);
        }
    },
    
    timeEnd: (label) => {
        if (PERFORMANCE_CONFIG.ENABLE_CONSOLE_TIME) {
            console.timeEnd(label);
        }
    },
    
    // Logs críticos que SIEMPRE se muestran (errores, warnings importantes, confirmaciones clave)
    critical: (message, ...args) => {
        console.log(message, ...args);
    },
    
    error: (message, ...args) => {
        console.error(message, ...args);
    },
    
    warn: (message, ...args) => {
        console.warn(message, ...args);
    },
    
    // Utilidad para medir tiempos sin console.time
    startTimer: () => performance.now(),
    
    endTimer: (startTime, operation = 'Operación') => {
        const elapsed = performance.now() - startTime;
        performanceLogger.log(`⏱️ ${operation}: ${elapsed.toFixed(2)}ms`);
        return elapsed;
    }
};

// Función helper para crear medidores de rendimiento
const createPerformanceMeasurer = (operation) => {
    return {
        start: () => {
            const startTime = performance.now();
            const id = `${operation}_${Date.now()}`;
            performanceLogger.time(id);
            return { startTime, id };
        },
        end: ({ startTime, id }, showLog = true) => {
            performanceLogger.timeEnd(id);
            const elapsed = performance.now() - startTime;
            if (showLog) {
                performanceLogger.log(`✅ ${operation} completado en ${elapsed.toFixed(2)}ms`);
            }
            return elapsed;
        }
    };
};

// Exportar configuración y utilidades
export { 
    PERFORMANCE_CONFIG, 
    performanceLogger, 
    createPerformanceMeasurer 
};

export default performanceLogger; 