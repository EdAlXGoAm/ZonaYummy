import React, { useState, useEffect, useMemo, useRef } from 'react';
import ordersApi from './../../../api/ordersApi';
import comandasApi from './../../../api/comandasApi';
import borradosApi from './../../../api/borradosApi';
import CocinaNewFeaturesComandaCard from './CocinaNewFeaturesComandaCard';
import { DebugCardHeightShell } from './CocinaNewFeaturesDebugCardHeight';
import {
    getKitchenDisplayPlatilloName,
    isTacoDeBirria,
} from './cocinaNewFeaturesComandaUtils';
import {
    filterOutRecentlyDelivered,
    getOrderSlotKey,
    isSameComanda,
} from '../kitchenComandaSyncUtils';
import { isOrigenWhatsapp } from '../Mesero/meseroOrigenUtils';
import {
    loadActiveComandasCache,
    loadCompactColumnsPreference,
    loadKitchenSpaceConfig,
    saveActiveComandasCache,
    saveCompactColumnsPreference,
    saveKitchenSpaceConfig,
} from './cocinaNewFeaturesViewCache';
import './CocinaNewFeaturesKitchenBoard.css';
import './CocinaNewFeaturesComandaCard.css';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const sortComandasByComandaId = (comandas) => [...comandas].sort(
    (a, b) => Number(a.ComandaId) - Number(b.ComandaId),
);

const FETCH_COMANDAS_DEBOUNCE_MS = 150;
const MAX_MAIN_COLUMNS = 4;
const COLUMN_CAPACITY = 1.0;
const MODEL_FIT_TOLERANCE = 0.005;
const DEFAULT_ADDITIONAL_ORDER_OVERHEAD_SPACE = 0.24;
const PERF_LOG_PREFIX = '[CocinaNewFeatures perf]';

const DEFAULT_SPACE_CONFIG = {
    platillos: {
        Hamburguesa: 1 / 2,
        'Hamburguesa con papas': 0.65,
        Tacos: 1 / 6,
        'Alitas a la BBQ': 0.35,
        'Alitas a la BBQ con papas': 0.5,
        'Alitas a la BBQ sin papas': 0.35,
        'C Hamburguesa': 1,
    },
    tacoDeBirria: 1 / 4,
    defaultComanda: 1 / 3,
    additionalOrderHeader: DEFAULT_ADDITIONAL_ORDER_OVERHEAD_SPACE,
};

const SPACE_CONFIG_FIELDS = [
    { type: 'object', key: 'additionalOrderHeader', label: 'Header extra' },
    { type: 'object', key: 'defaultComanda', label: 'Otros / default' },
    { type: 'object', key: 'tacoDeBirria', label: 'Taco de Birria' },
    { type: 'platillo', key: 'Tacos', label: 'Tacos' },
    { type: 'platillo', key: 'Hamburguesa', label: 'Hamburguesa' },
    { type: 'platillo', key: 'Hamburguesa con papas', label: 'Hamburguesa con papas' },
    { type: 'platillo', key: 'Alitas a la BBQ', label: 'Alitas a la BBQ' },
    { type: 'platillo', key: 'Alitas a la BBQ con papas', label: 'Alitas a la BBQ con papas' },
    { type: 'platillo', key: 'Alitas a la BBQ sin papas', label: 'Alitas a la BBQ sin papas' },
    { type: 'platillo', key: 'C Hamburguesa', label: 'C Hamburguesa' },
];

const getSpaceConfigFieldId = (field) => `${field.type}-${field.key}`;

const normalizeText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getSelectedVariantName = (comanda) => (
    comanda?.Details?.Variants?.[comanda?.Details?.SelectedVariant]?.VariantName || ''
);

const isHamburguesaConPapas = (comanda) => (
    comanda?.Platillo === 'Hamburguesa'
    && normalizeText(getSelectedVariantName(comanda)).includes('papas')
);

const isAlitasALaBBQ = (comanda) => {
    const platilloName = normalizeText(getKitchenDisplayPlatilloName(comanda));
    return platilloName.includes('alitas') && platilloName.includes('bbq');
};

const isAlitasALaBBQConPapas = (comanda) => (
    isAlitasALaBBQ(comanda)
    && normalizeText(getSelectedVariantName(comanda)).includes('con papas')
);

const isAlitasALaBBQSinPapas = (comanda) => (
    isAlitasALaBBQ(comanda)
    && normalizeText(getSelectedVariantName(comanda)).includes('sin papas')
);

const getComandaSpaceKey = (comanda) => {
    if (isTacoDeBirria(comanda)) {
        return 'tacoDeBirria';
    }
    if (isHamburguesaConPapas(comanda)) {
        return 'Hamburguesa con papas';
    }
    if (isAlitasALaBBQConPapas(comanda)) {
        return 'Alitas a la BBQ con papas';
    }
    if (isAlitasALaBBQSinPapas(comanda)) {
        return 'Alitas a la BBQ sin papas';
    }
    if (isAlitasALaBBQ(comanda)) {
        return 'Alitas a la BBQ';
    }
    return comanda?.Platillo || 'defaultComanda';
};

const getComandaSpace = (comanda, spaceConfig) => {
    const spaceKey = getComandaSpaceKey(comanda);
    if (spaceKey === 'tacoDeBirria') {
        return spaceConfig.tacoDeBirria;
    }
    return spaceConfig.platillos[spaceKey] ?? spaceConfig.defaultComanda;
};

const getSlotUsedSpace = (comandas, spaceConfig) => normalizeColumnSpace(comandas.reduce(
    (sum, comanda) => sum + getComandaSpace(comanda, spaceConfig),
    0,
));

const fitsColumnCapacity = (usedSpace, addedSpace = 0) => (
    usedSpace + addedSpace <= COLUMN_CAPACITY + MODEL_FIT_TOLERANCE
);

const normalizeColumnSpace = (space) => (
    Math.abs(space - COLUMN_CAPACITY) <= MODEL_FIT_TOLERANCE ? COLUMN_CAPACITY : space
);

const isFullColumnSlot = (slot) => slot.usedSpace >= COLUMN_CAPACITY - MODEL_FIT_TOLERANCE
    || (slot.comandas.length === 1 && slot.comandas[0].Platillo === 'C Hamburguesa');

const createOrderSlot = (order, comandas, partNumber, totalParts, spaceConfig) => ({
    orderId: order.orderId,
    customer: order.customer,
    origen: order.origen,
    comandas,
    total: comandas.reduce((sum, comanda) => sum + (comanda.Precio || 0), 0),
    usedSpace: getSlotUsedSpace(comandas, spaceConfig),
    algorithmOverheadSpace: 0,
    isPartial: totalParts > 1,
    partNumber: totalParts > 1 ? partNumber : null,
    totalParts: totalParts > 1 ? totalParts : null,
});

const splitOrderIntoSlots = (order, spaceConfig) => {
    const parts = [];
    let currentPart = [];
    let currentUsed = 0;

    order.comandas.forEach((comanda) => {
        const space = getComandaSpace(comanda, spaceConfig);
        if (fitsColumnCapacity(currentUsed, space)) {
            currentPart.push(comanda);
            currentUsed = normalizeColumnSpace(currentUsed + space);
            return;
        }

        if (currentPart.length > 0) {
            parts.push(currentPart);
        }
        currentPart = [comanda];
        currentUsed = space;
    });

    if (currentPart.length > 0) {
        parts.push(currentPart);
    }

    return parts.map((part, partIndex) => createOrderSlot(
        order,
        part,
        partIndex + 1,
        parts.length,
        spaceConfig,
    ));
};

const buildClassicColumns = (orders, spaceConfig) => {
    const allSlots = orders.flatMap((order) => splitOrderIntoSlots(order, spaceConfig));

    return {
        mainColumns: allSlots.slice(0, MAX_MAIN_COLUMNS).map((slot) => ({
            columnKey: getOrderSlotKey(slot),
            slots: [slot],
            usedSpace: slot.usedSpace,
        })),
        extraOrders: allSlots.slice(MAX_MAIN_COLUMNS),
    };
};

// Fill leftmost available space; each next order starts where the previous left room.
const buildSequentialFlowColumns = (orders, spaceConfig) => {
    const columns = [];
    const extraOrders = [];
    const additionalOrderOverheadSpace = spaceConfig.additionalOrderHeader;

    const getRemainingSpace = (column) => COLUMN_CAPACITY - column.usedSpace;

    const findLeftmostColumnWithSpace = () => {
        for (let index = 0; index < columns.length; index += 1) {
            const column = columns[index];
            if (column.blockOrderStart) {
                continue;
            }
            if (!column.hasFullSlot && getRemainingSpace(column) > MODEL_FIT_TOLERANCE) {
                return index;
            }
        }
        return columns.length;
    };

    const ensureColumn = (index) => {
        if (!columns[index]) {
            columns[index] = {
                columnKey: `flow-col-${index}`,
                slots: [],
                usedSpace: 0,
                hasFullSlot: false,
            };
        }
        return columns[index];
    };

    const syncColumnKey = (column) => {
        column.columnKey = column.slots.map(getOrderSlotKey).join('__');
    };

    const addSlotToColumn = (column, slot, orderFlowSlots) => {
        const previousSlot = column.slots[column.slots.length - 1];
        if (previousSlot?.orderId === slot.orderId) {
            previousSlot.comandas = [...previousSlot.comandas, ...slot.comandas];
            previousSlot.total += slot.total;
            previousSlot.usedSpace += slot.usedSpace;
            return previousSlot;
        }

        column.slots.push(slot);
        orderFlowSlots.push(slot);
        return slot;
    };

    orders.forEach((order) => {
        columns.forEach((column) => {
            column.blockOrderStart = false;
        });

        const comandas = order.comandas;
        let comandaIndex = 0;
        const orderFlowSlots = [];

        while (comandaIndex < comandas.length) {
            let columnIndex = findLeftmostColumnWithSpace();

            if (columnIndex >= MAX_MAIN_COLUMNS) {
                const remaining = comandas.slice(comandaIndex);
                if (remaining.length > 0) {
                    const overflowSlot = createOrderSlot(order, remaining, null, null, spaceConfig);
                    if (orderFlowSlots.length > 0) {
                        overflowSlot.isPartial = true;
                        overflowSlot.partNumber = orderFlowSlots.length + 1;
                        overflowSlot.totalParts = orderFlowSlots.length + 1;
                    }
                    extraOrders.push(overflowSlot);
                }
                break;
            }

            const column = ensureColumn(columnIndex);
            const previousSlot = column.slots[column.slots.length - 1];
            const startsNewOrderInColumn = column.slots.length > 0 && previousSlot?.orderId !== order.orderId;
            const orderOverheadSpace = startsNewOrderInColumn ? additionalOrderOverheadSpace : 0;
            const remainingSpace = getRemainingSpace(column) - orderOverheadSpace;
            const part = [];
            let partSpace = 0;

            while (comandaIndex < comandas.length) {
                const comanda = comandas[comandaIndex];
                const space = getComandaSpace(comanda, spaceConfig);

                if (
                    part.length === 0
                    && column.usedSpace > 0
                    && space > remainingSpace + MODEL_FIT_TOLERANCE
                ) {
                    break;
                }

                const partLimit = remainingSpace;

                if (
                    partSpace + space <= partLimit + MODEL_FIT_TOLERANCE
                    || (part.length === 0 && column.usedSpace === 0)
                ) {
                    part.push(comanda);
                    partSpace = normalizeColumnSpace(partSpace + space);
                    comandaIndex += 1;
                    continue;
                }

                break;
            }

            if (part.length === 0) {
                if (column.usedSpace > 0 && getRemainingSpace(column) > MODEL_FIT_TOLERANCE) {
                    // Gap is too small for the next comanda; continue on the next column.
                    column.blockOrderStart = true;
                    continue;
                }
                break;
            }

            const slot = createOrderSlot(order, part, null, null, spaceConfig);
            slot.algorithmOverheadSpace = orderOverheadSpace;
            const renderedSlot = addSlotToColumn(column, slot, orderFlowSlots);

            column.usedSpace = normalizeColumnSpace(column.usedSpace + slot.usedSpace + orderOverheadSpace);
            syncColumnKey(column);
            if (isFullColumnSlot(renderedSlot) || column.usedSpace >= COLUMN_CAPACITY - MODEL_FIT_TOLERANCE) {
                column.hasFullSlot = true;
            }
        }

        if (orderFlowSlots.length > 1) {
            orderFlowSlots.forEach((slot, index) => {
                slot.isPartial = true;
                slot.partNumber = index + 1;
                slot.totalParts = orderFlowSlots.length;
            });
            columns.forEach(syncColumnKey);
        }
    });

    return {
        mainColumns: columns.filter((column) => column.slots.length > 0),
        extraOrders,
    };
};

const CocinaNewFeaturesKitchenBoard = ({modeInterface, Orders, ordersLoaded = true}) => {
    const bootStartRef = useRef(performance.now());
    const initialCacheMetricsRef = useRef(null);
    const cacheRenderLoggedRef = useRef(false);
    const cacheRenderMsRef = useRef(null);
    const firstDbFetchStartRef = useRef(null);
    const firstDbGetLoggedRef = useRef(false);
    const [numOrders, setNumOrders] = useState([]);
    const [activeComandas, setActiveComandas] = useState(() => {
        const cacheStartMs = performance.now();
        console.log(`${PERF_LOG_PREFIX} antes de evaluar cache`, {
            sinceBootMs: Math.round(cacheStartMs - bootStartRef.current),
        });
        const cachedComandas = loadActiveComandasCache();
        const cacheEndMs = performance.now();
        initialCacheMetricsRef.current = {
            cacheStartMs,
            cacheEndMs,
            cachedCount: cachedComandas.length,
        };
        console.log(`${PERF_LOG_PREFIX} cache evaluado`, {
            durationMs: Math.round(cacheEndMs - cacheStartMs),
            cachedCount: cachedComandas.length,
            usedCache: cachedComandas.length > 0,
        });
        return cachedComandas;
    });
    const [arrayBebidas, setArrayBebidas] = useState([]);
    const [arrayWaffles, setArrayWaffles] = useState([]);
    const fetchSeqRef = useRef(0);
    const fetchComandasTimerRef = useRef(null);
    const recentlyDeliveredRef = useRef(new Map());
    const mainGridRef = useRef(null);
    const heightModalPointerStartedInsideRef = useRef(false);
    const [spaceConfig, setSpaceConfig] = useState(
        () => loadKitchenSpaceConfig(DEFAULT_SPACE_CONFIG),
    );
    const [spaceConfigDrafts, setSpaceConfigDrafts] = useState({});
    const [compactColumnsEnabled, setCompactColumnsEnabled] = useState(
        () => loadCompactColumnsPreference(),
    );
    const [heightDebugModalOpen, setHeightDebugModalOpen] = useState(false);
    const [columnHeightReport, setColumnHeightReport] = useState([]);
    const [spaceConfigJsonDraft, setSpaceConfigJsonDraft] = useState('');
    const [spaceConfigJsonMessage, setSpaceConfigJsonMessage] = useState('');

    const toggleCompactColumns = () => {
        setCompactColumnsEnabled((prev) => {
            const next = !prev;
            saveCompactColumnsPreference(next);
            return next;
        });
    };

    const updateSpaceConfig = (updater) => {
        setSpaceConfig((prev) => {
            const next = updater(prev);
            saveKitchenSpaceConfig(next);
            return next;
        });
    };

    const updateSpaceConfigPercent = (field, rawPercent) => {
        if (!/^\d*\.?\d*$/.test(rawPercent)) {
            return;
        }

        const fieldId = getSpaceConfigFieldId(field);
        setSpaceConfigDrafts((prev) => ({
            ...prev,
            [fieldId]: rawPercent,
        }));

        const percent = rawPercent === '' ? 0 : Number(rawPercent);
        if (!Number.isFinite(percent)) {
            return;
        }
        const value = Math.max(0, Math.min(percent / 100, 1.5));

        updateSpaceConfig((prev) => {
            if (field.type === 'platillo') {
                return {
                    ...prev,
                    platillos: {
                        ...prev.platillos,
                        [field.key]: value,
                    },
                };
            }

            return {
                ...prev,
                [field.key]: value,
            };
        });
    };

    const resetSpaceConfig = () => {
        setSpaceConfig(DEFAULT_SPACE_CONFIG);
        setSpaceConfigDrafts({});
        setSpaceConfigJsonDraft(JSON.stringify(DEFAULT_SPACE_CONFIG, null, 2));
        setSpaceConfigJsonMessage('Defaults restaurados');
        saveKitchenSpaceConfig(DEFAULT_SPACE_CONFIG);
    };

    const syncSpaceConfigJsonDraft = (config = spaceConfig) => {
        setSpaceConfigJsonDraft(JSON.stringify(config, null, 2));
        setSpaceConfigJsonMessage('');
    };

    const copySpaceConfigJson = async () => {
        const json = JSON.stringify(spaceConfig, null, 2);
        setSpaceConfigJsonDraft(json);
        try {
            await navigator.clipboard.writeText(json);
            setSpaceConfigJsonMessage('JSON copiado');
        } catch {
            setSpaceConfigJsonMessage('JSON listo para copiar manualmente');
        }
    };

    const importSpaceConfigJson = () => {
        try {
            const parsed = JSON.parse(spaceConfigJsonDraft);
            if (!parsed || typeof parsed !== 'object') {
                setSpaceConfigJsonMessage('JSON invalido');
                return;
            }

            const nextConfig = {
                ...DEFAULT_SPACE_CONFIG,
                ...parsed,
                platillos: {
                    ...DEFAULT_SPACE_CONFIG.platillos,
                    ...(parsed.platillos || {}),
                },
            };

            setSpaceConfig(nextConfig);
            setSpaceConfigDrafts({});
            saveKitchenSpaceConfig(nextConfig);
            setSpaceConfigJsonDraft(JSON.stringify(nextConfig, null, 2));
            setSpaceConfigJsonMessage('JSON aplicado');
        } catch {
            setSpaceConfigJsonMessage('JSON invalido');
        }
    };

    const getSpaceConfigPercentValue = (field) => {
        const value = field.type === 'platillo'
            ? spaceConfig.platillos[field.key]
            : spaceConfig[field.key];
        return ((value || 0) * 100).toFixed(1);
    };

    const getSpaceConfigDraftValue = (field) => {
        const fieldId = getSpaceConfigFieldId(field);
        return spaceConfigDrafts[fieldId] ?? getSpaceConfigPercentValue(field);
    };

    const getSpaceConfigDraftFraction = (field) => {
        const draftValue = getSpaceConfigDraftValue(field);
        const percent = draftValue === '' ? 0 : Number(draftValue);
        return (Number.isFinite(percent) ? percent / 100 : 0).toFixed(3);
    };

    const buildColumnHeightReport = () => {
        const grid = mainGridRef.current;
        if (!grid) {
            setColumnHeightReport([]);
            return;
        }

        const getHeight = (element) => Math.round(element.getBoundingClientRect().height);
        const getBodyPaddingHeight = (body) => {
            const bodyStyle = window.getComputedStyle(body);
            return Math.round(
                Number.parseFloat(bodyStyle.paddingTop || '0')
                + Number.parseFloat(bodyStyle.paddingBottom || '0'),
            );
        };

        const measuredElements = Array.from(grid.querySelectorAll('[data-height-id]'));
        const findMeasuredElement = (heightId) => measuredElements.find(
            (element) => element.dataset.heightId === heightId,
        );
        const getMeasuredHeight = (heightId) => {
            const element = findMeasuredElement(heightId);
            return element ? getHeight(element) : null;
        };
        const getMeasuredBodyPaddingHeight = (heightId) => {
            const element = findMeasuredElement(heightId);
            return element ? getBodyPaddingHeight(element) : null;
        };

        const columns = Array.from(grid.querySelectorAll('.order-column:not(.order-column-empty)'));
        const nextReport = mainColumns.map((columnModel, columnIndex) => {
            const column = columns[columnIndex];
            const elements = [];
            const addElement = (type, id, label, heightPx, modelSpace = 0, modelNote = '') => {
                elements.push({ type, id, label, heightPx, modelSpace, modelNote });
            };

            columnModel.slots.forEach((slot, slotIndex) => {
                const slotKey = getOrderSlotKey(slot);
                const headerId = `order-header-${slotKey}`;
                const bodyId = `order-body-${slotKey}`;
                const headerModelSpace = slot.algorithmOverheadSpace || 0;

                addElement(
                    headerModelSpace > 0 ? 'Header extra' : 'Header base',
                    headerId,
                    `Header orden #${slot.orderId}${slot.isPartial ? ` (${slot.partNumber}/${slot.totalParts})` : ''}`,
                    getMeasuredHeight(headerId),
                    headerModelSpace,
                    headerModelSpace > 0 ? 'descuenta capacidad' : 'base de columna',
                );

                addElement(
                    'Padding body',
                    bodyId,
                    `Padding orden #${slot.orderId}${slot.isPartial ? ` (${slot.partNumber}/${slot.totalParts})` : ''}`,
                    getMeasuredBodyPaddingHeight(bodyId),
                    0,
                    slotIndex > 0 ? 'incluido en header extra' : 'base de columna',
                );

                slot.comandas.forEach((comanda) => {
                    const comandaSpace = getComandaSpace(comanda, spaceConfig);
                    const comandaSpaceKey = getComandaSpaceKey(comanda);
                    addElement(
                        'Tarjeta comanda',
                        `comanda-${comanda.ComandaId}`,
                        `Comanda #${comanda.ComandaId} · Orden #${slot.orderId} · ${getKitchenDisplayPlatilloName(comanda)}`,
                        getMeasuredHeight(`comanda-${comanda.ComandaId}`),
                        comandaSpace,
                        `${comandaSpaceKey}: ${comandaSpace.toFixed(3)} de 1.000`,
                    );
                });
            });

            const totalHeightPx = elements.reduce((sum, element) => sum + (element.heightPx || 0), 0);
            const columnHeightPx = column ? getHeight(column) : 0;
            const modelUsedSpace = columnModel.usedSpace ?? elements.reduce(
                (sum, element) => sum + (element.modelSpace || 0),
                0,
            );
            const modelRemainingSpace = Math.max(COLUMN_CAPACITY - modelUsedSpace, 0);

            return {
                columnId: column?.dataset.heightId || `column-${columnIndex + 1}`,
                label: column?.dataset.heightLabel || `Columna ${columnIndex + 1}`,
                columnHeightPx,
                totalHeightPx,
                overflowPx: Math.max(totalHeightPx - columnHeightPx, 0),
                modelUsedSpace,
                modelRemainingSpace,
                modelOverflowSpace: Math.max(modelUsedSpace - COLUMN_CAPACITY, 0),
                elements,
            };
        });

        setColumnHeightReport(nextReport);
    };

    const openHeightDebugModal = () => {
        syncSpaceConfigJsonDraft();
        buildColumnHeightReport();
        setHeightDebugModalOpen(true);
    };

    const handleHeightModalOverlayPointerDown = (e) => {
        heightModalPointerStartedInsideRef.current = e.target !== e.currentTarget;
    };

    const handleHeightModalOverlayClick = (e) => {
        if (e.target === e.currentTarget && !heightModalPointerStartedInsideRef.current) {
            setHeightDebugModalOpen(false);
        }
        heightModalPointerStartedInsideRef.current = false;
    };

    useEffect(() => {
        if (cacheRenderLoggedRef.current) {
            return undefined;
        }

        const frameId = requestAnimationFrame(() => {
            if (cacheRenderLoggedRef.current) {
                return;
            }
            cacheRenderLoggedRef.current = true;
            const now = performance.now();
            cacheRenderMsRef.current = now;
            const cacheMetrics = initialCacheMetricsRef.current;
            console.log(`${PERF_LOG_PREFIX} render inicial posterior a cache`, {
                cachedCount: cacheMetrics?.cachedCount ?? activeComandas.length,
                cacheEvalToRenderMs: cacheMetrics ? Math.round(now - cacheMetrics.cacheEndMs) : null,
                sinceBootMs: Math.round(now - bootStartRef.current),
            });
        });

        return () => cancelAnimationFrame(frameId);
    }, []);

    // Estado para el menú contextual (comandas individuales)
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        comanda: null
    });

    // Manejar clic derecho sobre una tarjeta
    const handleContextMenu = (e, comanda) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            comanda
        });
    };

    // Cerrar menú contextual
    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, comanda: null });
    };

    // Solicitar borrado de comanda (requiere autorización)
    const handleDeleteComanda = async () => {
        if (!contextMenu.comanda) return;

        const comanda = contextMenu.comanda;
        const confirmar = window.confirm(
            '¿Solicitar eliminación de esta comanda? Un supervisor debe autorizarla en /eliminar.',
        );
        if (!confirmar) return;

        try {
            await borradosApi.solicitarBorrado(comanda);
            socket.emit('SolicitudBorradoDesdeCliente', {
                comandaMongoId: comanda._id,
                OrderID: comanda.OrderID,
            });
            alert('Solicitud de borrado enviada. Pendiente de autorización.');
            closeContextMenu();
        } catch (error) {
            console.error('Error al solicitar borrado:', error);
            const msg = error.response?.data?.error || 'Error al solicitar el borrado de la comanda';
            alert(msg);
        }
    };

    const markComandaDeliveredLocally = (comanda) => {
        if (comanda?._id) {
            recentlyDeliveredRef.current.set(comanda._id, Date.now());
        }
        setActiveComandas((prev) => {
            const next = prev.filter((c) => !isSameComanda(c, comanda));
            saveActiveComandasCache(next);
            return next;
        });
    };

    // Marcar comanda como entregada
    const handleMarkAsDelivered = async () => {
        if (!contextMenu.comanda) return;
        
        const comanda = contextMenu.comanda;
        
        try {
            const updatedComanda = {
                ...comanda,
                ComandaPrepStatus: "ReadyToServe"
            };
            await comandasApi.updateComanda(updatedComanda);
            
            socket.emit('UpdateComandaDesdeCliente', { msg: `Update-${comanda.OrderID}-${comanda.Platillo}` });
            socket.emit('OrdenActualizadaDesdeCliente', { msg: comanda.OrderID });
            
            markComandaDeliveredLocally(comanda);
            closeContextMenu();
        } catch (error) {
            console.error("Error al marcar como entregado:", error);
            alert("Error al marcar como entregado");
        }
    };

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        if (!contextMenu.visible) return;
        
        const handleClickOutside = (e) => {
            const menu = document.querySelector('.context-menu');
            if (menu && menu.contains(e.target)) return;
            closeContextMenu();
        };
        
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('contextmenu', handleClickOutside);
        }, 10);
        
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('contextmenu', handleClickOutside);
        };
    }, [contextMenu.visible]);

    const fetchComandasFromOrders = () => {
        const fetchId = ++fetchSeqRef.current;
        const fetchStartMs = performance.now();
        if (!ordersLoaded && Orders.length === 0) {
            console.log(`${PERF_LOG_PREFIX} GET comandas omitido: Orders aun no cargado`, {
                sinceBootMs: Math.round(fetchStartMs - bootStartRef.current),
            });
            return;
        }

        setNumOrders(Orders.length);
        let localOrders = Orders;

        if (localOrders.length > 0 && firstDbFetchStartRef.current == null) {
            firstDbFetchStartRef.current = fetchStartMs;
            console.log(`${PERF_LOG_PREFIX} primer GET DB iniciado`, {
                ordersCount: localOrders.length,
                sinceBootMs: Math.round(fetchStartMs - bootStartRef.current),
                sinceCacheRenderMs: cacheRenderMsRef.current == null
                    ? null
                    : Math.round(fetchStartMs - cacheRenderMsRef.current),
            });
        }

        let comandasPromises = localOrders.map(order => {
            return comandasApi.getComandasByOrderId(order.OrderID)
                .then(response => {
                    const res_comandas = response.map(comanda => {
                        return {
                            ...comanda,
                            Customer: order.Customer,
                            Origen: order.Origen || ''
                        };
                    });
                    return res_comandas;
                })
                .catch(() => {
                    return [];
                });
        });
        
        Promise.all(comandasPromises).then(comandasResults => {
            if (fetchId !== fetchSeqRef.current) {
                return;
            }
            const localActiveComandas = filterOutRecentlyDelivered(
                comandasResults.flat(),
                recentlyDeliveredRef,
            );
            saveActiveComandasCache(localActiveComandas);
            setActiveComandas(localActiveComandas);
            if (localOrders.length > 0 && !firstDbGetLoggedRef.current) {
                const fetchEndMs = performance.now();
                const firstFetchStartMs = firstDbFetchStartRef.current ?? fetchStartMs;
                firstDbGetLoggedRef.current = true;
                console.log(`${PERF_LOG_PREFIX} primer GET DB resuelto`, {
                    ordersCount: localOrders.length,
                    comandasCount: localActiveComandas.length,
                    getDurationMs: Math.round(fetchEndMs - firstFetchStartMs),
                    sinceCacheRenderMs: cacheRenderMsRef.current == null
                        ? null
                        : Math.round(fetchEndMs - cacheRenderMsRef.current),
                    sinceBootMs: Math.round(fetchEndMs - bootStartRef.current),
                });
            }
        }).catch(e => {
            if (fetchId !== fetchSeqRef.current) {
                return;
            }
            console.error("Error al recuperar comandas: ", e);
        });
    };

    const scheduleFetchComandas = () => {
        if (fetchComandasTimerRef.current) {
            clearTimeout(fetchComandasTimerRef.current);
        }
        fetchComandasTimerRef.current = setTimeout(() => {
            fetchComandasTimerRef.current = null;
            fetchComandasFromOrders();
        }, FETCH_COMANDAS_DEBOUNCE_MS);
    };

    useEffect(() => {
        scheduleFetchComandas();
        return () => {
            if (fetchComandasTimerRef.current) {
                clearTimeout(fetchComandasTimerRef.current);
            }
        };
    }, [Orders, ordersLoaded]);

    // Separar bebidas y waffles del resto
    const fetchCategorias = () => {
        let localComandasForCategorize = [...activeComandas].filter(c => c.ComandaPrepStatus !== "ReadyToServe");
        const localArrayBebidas = localComandasForCategorize.filter(c => c.Categoria === "Bebidas");
        const localArrayWaffles = localComandasForCategorize.filter(c => c.Categoria === "Waffles");

        setArrayBebidas(localArrayBebidas);
        setArrayWaffles(localArrayWaffles);
    };

    useEffect(() => { 
        fetchCategorias();
    }, [activeComandas]);

    // ========== NUEVO LAYOUT: 4 COLUMNAS ==========
    
    // Agrupar comandas por OrderID (excluyendo bebidas, waffles y postres)
    const ordersGrouped = useMemo(() => {
        const orderMap = new Map();
        
        // Filtrar comandas: excluir ReadyToServe, Bebidas, Waffles y Postres
        const filteredComandas = activeComandas.filter(c => 
            c.ComandaPrepStatus !== "ReadyToServe" && 
            c.Categoria !== "Bebidas" && 
            c.Categoria !== "Waffles" &&
            c.Categoria !== "Postres"
        );
        
        filteredComandas.forEach(comanda => {
            const orderId = comanda.OrderID;
            if (!orderMap.has(orderId)) {
                orderMap.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    origen: comanda.Origen || '',
                    comandas: [],
                    total: 0
                });
            }
            const order = orderMap.get(orderId);
            order.comandas.push(comanda);
            order.total += comanda.Precio || 0;
            // Actualizar origen si viene de una comanda posterior
            if (comanda.Origen && !order.origen) {
                order.origen = comanda.Origen;
            }
        });

        return Array.from(orderMap.values())
            .map((order) => ({
                ...order,
                comandas: sortComandasByComandaId(order.comandas),
            }))
            .sort((a, b) => Number(a.orderId) - Number(b.orderId));
    }, [activeComandas]);

    const { mainColumns, extraOrders } = useMemo(() => {
        if (!compactColumnsEnabled) {
            return buildClassicColumns(ordersGrouped, spaceConfig);
        }
        return buildSequentialFlowColumns(ordersGrouped, spaceConfig);
    }, [ordersGrouped, compactColumnsEnabled, spaceConfig]);

    useEffect(() => {
        if (heightDebugModalOpen) {
            buildColumnHeightReport();
        }
    }, [heightDebugModalOpen, mainColumns]);

    // Componente para el header con burbujas animadas (tren de burbujas)
    const BubbleTrainHeader = ({ order }) => {
        const bubbleCount = order.comandas.length;
        const maxVisibleBubbles = 4;
        const needsAnimation = bubbleCount > maxVisibleBubbles;
        const slotKey = getOrderSlotKey(order);

        return (
            <div
                className="column-header"
                data-height-id={`order-header-${slotKey}`}
                data-height-label={`Header orden #${order.orderId}${order.isPartial ? ` (${order.partNumber}/${order.totalParts})` : ''}`}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className="column-header-info">
                    <span className="column-order-number">
                        #{order.orderId}
                        {order.isPartial && <span className="order-part-badge">({order.partNumber}/{order.totalParts})</span>}
                    </span>
                    <span className={`column-customer colorTextClienteCocina${order.orderId % 10}`}>
                        {isOrigenWhatsapp(order.origen) && (
                            <img 
                                src="icons/whatsapp.png" 
                                alt="WhatsApp" 
                                className="whatsapp-icon-header"
                            />
                        )}
                        {order.customer || 'Cliente'}
                    </span>
                    <span className="column-total">${order.total.toFixed(0)}</span>
                </div>
                <div className="bubble-train-container">
                    <div className={`bubble-train ${needsAnimation ? 'bubble-train-animated' : ''}`}
                         style={needsAnimation ? { '--bubble-count': bubbleCount } : {}}>
                        {order.comandas.map((comanda, idx) => (
                            <div 
                                key={comanda.ComandaId} 
                                className="bubble-train-item"
                                title={getKitchenDisplayPlatilloName(comanda)}
                            >
                                <img 
                                    src={comanda.Imagen} 
                                    alt={comanda.Platillo}
                                    onError={(e) => { e.target.src = 'placeholder.png'; }}
                                />
                                <span className="bubble-train-price">${comanda.Precio || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Columna con un solo platillo "C Hamburguesa" expande altura al contenido
    const isExpandHeightColumn = (order) =>
        order?.comandas?.length === 1 && order.comandas[0].Platillo === 'C Hamburguesa';

    // Render a main-board column (single order or sequential flow when compact mode is on).
    const renderOrderColumn = (column) => {
        if (!column?.slots?.length) {
            return null;
        }

        const isFlowColumn = column.slots.length > 1;
        const expandHeight = !isFlowColumn && isExpandHeightColumn(column.slots[0]);

        return (
            <div
                key={column.columnKey}
                className={`order-column${isFlowColumn ? ' order-column--flow' : ''}${expandHeight ? ' order-column--expand-height' : ''}`}
                data-height-id={`column-${column.columnKey}`}
                data-height-label={`Columna ${column.columnKey}`}
            >
                {isFlowColumn ? (
                    <div className="order-column-scroll">
                        {column.slots.map((order, slotIndex) => (
                            <div
                                key={getOrderSlotKey(order)}
                                className={`order-column-slot${slotIndex > 0 ? ' order-column-slot--continued' : ''}`}
                                data-height-id={`order-slot-${getOrderSlotKey(order)}`}
                                data-height-label={`Orden #${order.orderId}${order.isPartial ? ` (${order.partNumber}/${order.totalParts})` : ''}`}
                            >
                                <BubbleTrainHeader order={order} />
                                <div
                                    className="order-column-body order-column-body--flow"
                                    data-height-id={`order-body-${getOrderSlotKey(order)}`}
                                    data-height-label={`Body orden #${order.orderId}${order.isPartial ? ` (${order.partNumber}/${order.totalParts})` : ''}`}
                                >
                                    {order.comandas.map((comanda) => (
                                        <div
                                            key={comanda.ComandaId}
                                            className="order-column-comanda"
                                            data-height-id={`comanda-${comanda.ComandaId}`}
                                            data-height-label={`Comanda #${comanda.ComandaId} · Orden #${order.orderId} · ${getKitchenDisplayPlatilloName(comanda)}`}
                                            onContextMenu={(e) => handleContextMenu(e, comanda)}
                                        >
                                            <CocinaNewFeaturesComandaCard Comanda={comanda} compact comandaNumber={comanda.ComandaId} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <BubbleTrainHeader order={column.slots[0]} />
                        <div
                            className="order-column-body"
                            data-height-id={`order-body-${getOrderSlotKey(column.slots[0])}`}
                            data-height-label={`Body orden #${column.slots[0].orderId}${column.slots[0].isPartial ? ` (${column.slots[0].partNumber}/${column.slots[0].totalParts})` : ''}`}
                        >
                            {column.slots[0].comandas.map((comanda) => (
                                <div
                                    key={comanda.ComandaId}
                                    className="order-column-comanda"
                                    data-height-id={`comanda-${comanda.ComandaId}`}
                                    data-height-label={`Comanda #${comanda.ComandaId} · Orden #${column.slots[0].orderId} · ${getKitchenDisplayPlatilloName(comanda)}`}
                                    onContextMenu={(e) => handleContextMenu(e, comanda)}
                                >
                                    <CocinaNewFeaturesComandaCard Comanda={comanda} compact comandaNumber={comanda.ComandaId} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    // Helper para obtener los aderezos de una hamburguesa
    const getAderezosPreview = (comanda) => {
        if (comanda.Platillo !== "Hamburguesa") return null;
        
        const selectedVariant = comanda.Details?.Variants?.[comanda.Details?.SelectedVariant];
        if (!selectedVariant) return null;
        
        // Buscar el grupo de ingredientes llamado "Aderezos"
        const aderezosGroup = selectedVariant.Ingredientes?.find(ing => ing.Name === "Aderezos");
        if (!aderezosGroup || !aderezosGroup.Items) return null;
        
        // Obtener los aderezos seleccionados (Checked = true)
        const selectedAderezos = aderezosGroup.Items.filter(item => item.Checked).map(item => item.Name);
        
        if (selectedAderezos.length === 0) return "SIN ADEREZOS";
        if (selectedAderezos.length === aderezosGroup.Items.length) return "TODOS";
        
        return selectedAderezos.join(", ");
    };

    // Renderizar órdenes extra en formato reducido (panel lateral)
    const renderExtraOrdersPanel = () => {
        if (extraOrders.length === 0) return null;

        return (
            <>
                <div className="bebidas-header proximas-header">
                    <span>PRÓXIMAS</span>
                    <span className="bebidas-header-count">{extraOrders.length}</span>
                </div>
                <div className="bebidas-list">
                    {extraOrders.map(order => (
                        <div key={getOrderSlotKey(order)} className="bebidas-order-card">
                            <div className="bebidas-order-header">
                                <div className="bebidas-order-title">
                                    <div className="bebidas-order-number">#{order.orderId}</div>
                                    <div className="bebidas-order-subtitle">{order.customer || 'Cliente'}</div>
                                </div>
                                <div className="bebidas-order-metrics">
                                    <span className="bebidas-pill bebidas-pill-count">{order.comandas.length} items</span>
                                    <span className="bebidas-pill bebidas-pill-total">${order.total.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="bebidas-items">
                                {order.comandas.map((comanda, comandaIndex) => {
                                    // Calcular tiempo transcurrido
                                    const getTimeAgo = () => {
                                        if (!comanda.CreatedAt) return null;
                                        const created = new Date(comanda.CreatedAt);
                                        const now = new Date();
                                        const diffMs = now - created;
                                        const diffMins = Math.floor(diffMs / 60000);
                                        if (diffMins < 1) return { text: 'ahora', urgency: 'normal' };
                                        if (diffMins < 10) return { text: `${diffMins} min`, urgency: 'normal' };
                                        if (diffMins < 20) return { text: `${diffMins} min`, urgency: 'warning' };
                                        return { text: `${diffMins} min`, urgency: 'urgent' };
                                    };
                                    const timeAgo = getTimeAgo();
                                    const displayPlatilloName = getKitchenDisplayPlatilloName(comanda);
                                    const variantName = comanda.Details?.Variants?.[comanda.Details?.SelectedVariant]?.VariantName;
                                    
                                    return (
                                    <DebugCardHeightShell
                                        key={comanda.ComandaId}
                                        trackKey={`extra-${comanda.ComandaId}-${comanda._id}`}
                                        className="bebida-item"
                                        badgeVariant="bebida"
                                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                                        style={{ cursor: 'context-menu', position: 'relative' }}
                                    >
                                        {/* Número de comanda arriba a la derecha */}
                                        <div className="bebida-comanda-number">{comanda.ComandaId}</div>
                                        
                                        {/* Tiempo transcurrido */}
                                        {timeAgo && (
                                            <div className={`bebida-time-badge bebida-time-${timeAgo.urgency}`}>
                                                {timeAgo.text}
                                            </div>
                                        )}
                                        
                                        <div className="bebida-icons-stack">
                                            <div className="bebida-deliver-icon">
                                                <img 
                                                    src={comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                                    alt={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                                />
                                            </div>
                                            <div className="bebida-thumb">
                                                {comanda.Imagen ? (
                                                    <img src={comanda.Imagen} alt={comanda.Platillo} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                ) : (
                                                    <div className="bebida-thumb-fallback" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="bebida-meta">
                                            <div className="bebida-name-row">
                                                <div className="bebida-name">{displayPlatilloName}</div>
                                            </div>
                                            {variantName && (
                                                <div className="bebida-variant-badge">{variantName.toUpperCase()}</div>
                                            )}
                                            {comanda.Platillo === "Hamburguesa" && getAderezosPreview(comanda) && (
                                                <div className={`hamburguesa-aderezos-preview ${getAderezosPreview(comanda) === "TODOS" ? 'aderezos-todos' : ''}`}>
                                                    <span className="aderezos-label">Aderezos:</span> {getAderezosPreview(comanda)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="bebida-right">
                                            <div className="bebida-price">${Number(comanda.Precio || 0).toFixed(0)}</div>
                                        </div>
                                    </DebugCardHeightShell>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Renderizar bebidas agrupadas por orden (panel lateral)
    const renderBebidasPanel = () => {
        if (arrayBebidas.length === 0) return null;

        // Agrupar bebidas por OrderID
        const bebidasByOrder = new Map();
        arrayBebidas.forEach(comanda => {
            const orderId = comanda.OrderID;
            if (!bebidasByOrder.has(orderId)) {
                bebidasByOrder.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    comandas: [],
                    total: 0
                });
            }
            const order = bebidasByOrder.get(orderId);
            order.comandas.push(comanda);
            order.total += comanda.Precio || 0;
        });

        const orderedBebidas = Array.from(bebidasByOrder.values())
            .map((order) => ({
                ...order,
                comandas: sortComandasByComandaId(order.comandas),
            }))
            .sort((a, b) => Number(a.orderId) - Number(b.orderId));

        return (
            <>
                <div className="bebidas-header">
                    <span>BEBIDAS</span>
                    <span className="bebidas-header-count">{arrayBebidas.length}</span>
                </div>
                <div className="bebidas-list">
                    {orderedBebidas.map(order => (
                        <div key={order.orderId} className="bebidas-order-card">
                            <div className="bebidas-order-header">
                                <div className="bebidas-order-title">
                                    <div className="bebidas-order-number">#{order.orderId}</div>
                                    <div className="bebidas-order-subtitle">{order.customer || 'Cliente'}</div>
                                </div>
                                <div className="bebidas-order-metrics">
                                    <span className="bebidas-pill bebidas-pill-count">{order.comandas.length} bebidas</span>
                                    <span className="bebidas-pill bebidas-pill-total">${order.total.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="bebidas-items">
                                {order.comandas.map((comanda, comandaIndex) => {
                                    const getTimeAgo = () => {
                                        if (!comanda.CreatedAt) return null;
                                        const created = new Date(comanda.CreatedAt);
                                        const now = new Date();
                                        const diffMs = now - created;
                                        const diffMins = Math.floor(diffMs / 60000);
                                        if (diffMins < 1) return { text: 'ahora', urgency: 'normal' };
                                        if (diffMins < 10) return { text: `${diffMins} min`, urgency: 'normal' };
                                        if (diffMins < 20) return { text: `${diffMins} min`, urgency: 'warning' };
                                        return { text: `${diffMins} min`, urgency: 'urgent' };
                                    };
                                    const timeAgo = getTimeAgo();
                                    
                                    return (
                                    <DebugCardHeightShell
                                        key={comanda.ComandaId}
                                        trackKey={`bebida-${comanda.ComandaId}-${comanda._id}`}
                                        className="bebida-item"
                                        badgeVariant="bebida"
                                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                                        style={{ cursor: 'context-menu', position: 'relative' }}
                                    >
                                        <div className="bebida-comanda-number">{comanda.ComandaId}</div>
                                        {timeAgo && (
                                            <div className={`bebida-time-badge bebida-time-${timeAgo.urgency}`}>
                                                {timeAgo.text}
                                            </div>
                                        )}
                                        <div className="bebida-icons-stack">
                                            <div className="bebida-deliver-icon">
                                                <img 
                                                    src={comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                                    alt={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                                />
                                            </div>
                                            <div className="bebida-thumb">
                                                {comanda.Imagen ? (
                                                    <img src={comanda.Imagen} alt={comanda.Platillo} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                ) : (
                                                    <div className="bebida-thumb-fallback" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="bebida-meta">
                                            <div className="bebida-name-row">
                                                <div className="bebida-name">{comanda.Platillo}</div>
                                            </div>
                                            {comanda.Details?.Variants?.[comanda.Details?.SelectedVariant]?.VariantName && (
                                                <div className="bebida-descriptor">{comanda.Details.Variants[comanda.Details.SelectedVariant].VariantName}</div>
                                            )}
                                        </div>
                                        <div className="bebida-right">
                                            <div className="bebida-price">${Number(comanda.Precio || 0).toFixed(0)}</div>
                                        </div>
                                    </DebugCardHeightShell>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Renderizar waffles agrupados por orden (panel lateral)
    const renderWafflesPanel = () => {
        if (arrayWaffles.length === 0) return null;

        // Agrupar waffles por OrderID
        const wafflesByOrder = new Map();
        arrayWaffles.forEach(comanda => {
            const orderId = comanda.OrderID;
            if (!wafflesByOrder.has(orderId)) {
                wafflesByOrder.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    comandas: [],
                    total: 0
                });
            }
            const order = wafflesByOrder.get(orderId);
            order.comandas.push(comanda);
            order.total += comanda.Precio || 0;
        });

        const orderedWaffles = Array.from(wafflesByOrder.values())
            .map((order) => ({
                ...order,
                comandas: sortComandasByComandaId(order.comandas),
            }))
            .sort((a, b) => Number(a.orderId) - Number(b.orderId));

        return (
            <>
                <div className="bebidas-header waffles-header">
                    <span>WAFFLES</span>
                    <span className="bebidas-header-count">{arrayWaffles.length}</span>
                </div>
                <div className="bebidas-list waffles-list">
                    {orderedWaffles.map(order => (
                        <div key={order.orderId} className="bebidas-order-card">
                            <div className="bebidas-order-header">
                                <div className="bebidas-order-title">
                                    <div className="bebidas-order-number">#{order.orderId}</div>
                                    <div className="bebidas-order-subtitle">{order.customer || 'Cliente'}</div>
                                </div>
                                <div className="bebidas-order-metrics">
                                    <span className="bebidas-pill bebidas-pill-count">{order.comandas.length} waffles</span>
                                    <span className="bebidas-pill bebidas-pill-total">${order.total.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="bebidas-items">
                                {order.comandas.map((comanda, comandaIndex) => {
                                    const getTimeAgo = () => {
                                        if (!comanda.CreatedAt) return null;
                                        const created = new Date(comanda.CreatedAt);
                                        const now = new Date();
                                        const diffMs = now - created;
                                        const diffMins = Math.floor(diffMs / 60000);
                                        if (diffMins < 1) return { text: 'ahora', urgency: 'normal' };
                                        if (diffMins < 10) return { text: `${diffMins} min`, urgency: 'normal' };
                                        if (diffMins < 20) return { text: `${diffMins} min`, urgency: 'warning' };
                                        return { text: `${diffMins} min`, urgency: 'urgent' };
                                    };
                                    const timeAgo = getTimeAgo();
                                    
                                    return (
                                    <DebugCardHeightShell
                                        key={comanda.ComandaId}
                                        trackKey={`waffle-${comanda.ComandaId}-${comanda._id}`}
                                        className="bebida-item"
                                        badgeVariant="bebida"
                                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                                        style={{ cursor: 'context-menu', position: 'relative' }}
                                    >
                                        <div className="bebida-comanda-number">{comanda.ComandaId}</div>
                                        {timeAgo && (
                                            <div className={`bebida-time-badge bebida-time-${timeAgo.urgency}`}>
                                                {timeAgo.text}
                                            </div>
                                        )}
                                        <div className="bebida-icons-stack">
                                            <div className="bebida-deliver-icon">
                                                <img 
                                                    src={comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                                    alt={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                                />
                                            </div>
                                            <div className="bebida-thumb">
                                                {comanda.Imagen ? (
                                                    <img src={comanda.Imagen} alt={comanda.Platillo} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                ) : (
                                                    <div className="bebida-thumb-fallback" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="bebida-meta">
                                            <div className="bebida-name-row">
                                                <div className="bebida-name">{comanda.Platillo}</div>
                                            </div>
                                            {comanda.Details?.Variants?.[comanda.Details?.SelectedVariant]?.VariantName && (
                                                <div className="bebida-descriptor">{comanda.Details.Variants[comanda.Details.SelectedVariant].VariantName}</div>
                                            )}
                                        </div>
                                        <div className="bebida-right">
                                            <div className="bebida-price">${Number(comanda.Precio || 0).toFixed(0)}</div>
                                        </div>
                                    </DebugCardHeightShell>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Socket listeners
    useEffect(() => {
        socket.on('NuevaComandaDesdeServidor', () => {
            scheduleFetchComandas();
        });
        return () => socket.off('NuevaComandaDesdeServidor');
    }, [Orders]);

    useEffect(() => {
        socket.on('UpdateComandaDesdeServidor', () => scheduleFetchComandas());
        return () => socket.off('UpdateComandaDesdeServidor');
    }, [Orders]);

    useEffect(() => {
        socket.on('DeleteComandaDesdeServidor', () => scheduleFetchComandas());
        return () => socket.off('DeleteComandaDesdeServidor');
    }, [Orders]);

    // Verificar si hay contenido
    const hasMainOrders = mainColumns.length > 0;
    const hasExtraOrders = extraOrders.length > 0;
    const hasBebidas = arrayBebidas.length > 0;
    const hasWaffles = arrayWaffles.length > 0;
    const hasLeftPanel = hasExtraOrders || hasBebidas || hasWaffles;
    const hasAnything = hasMainOrders || hasExtraOrders || hasBebidas || hasWaffles;

    return (
        <div className="cocina-new-layout">
            <div className="cnf-floating-actions">
                <button
                    type="button"
                    className={`cnf-compact-columns-toggle${compactColumnsEnabled ? ' cnf-compact-columns-toggle--active' : ''}`}
                    onClick={toggleCompactColumns}
                    aria-pressed={compactColumnsEnabled}
                    title="Muestra las órdenes en orden y continúa en el espacio libre de cada columna"
                >
                    <span className="cnf-compact-columns-toggle__label">Flujo continuo</span>
                    <span
                        className="cnf-compact-columns-toggle__switch"
                        aria-hidden="true"
                    >
                        <span className="cnf-compact-columns-toggle__knob" />
                    </span>
                </button>
                <button
                    type="button"
                    className="cnf-height-debug-button"
                    onClick={openHeightDebugModal}
                    title="Ver alturas medidas por columna"
                >
                    Alturas
                </button>
            </div>

            {/* Layout principal */}
            <div className="main-layout">
                {/* Panel lateral izquierdo: Órdenes Próximas + Bebidas + Waffles */}
                {hasLeftPanel && (
                    <div className="bebidas-column">
                        {renderExtraOrdersPanel()}
                        {renderBebidasPanel()}
                        {renderWafflesPanel()}
                    </div>
                )}

                {/* Contenido principal: 4 columnas de órdenes */}
                <div className="content-right">
                    {hasMainOrders ? (
                        <div className="four-columns-grid" ref={mainGridRef}>
                            {mainColumns.map((column) => renderOrderColumn(column))}
                            {/* Columnas vacías si hay menos de 4 órdenes */}
                            {Array.from({ length: MAX_MAIN_COLUMNS - mainColumns.length }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="order-column order-column-empty">
                                    <div className="column-header column-header-empty">
                                        <span className="empty-column-text">Sin orden</span>
                                    </div>
                                    <div className="order-column-body order-column-body-empty"></div>
                                </div>
                            ))}
                        </div>
                    ) : hasAnything ? (
                        <div className="no-orders-message">
                            <span>No hay órdenes principales pendientes</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Mensaje cuando no hay nada */}
            {!hasAnything && (
                <div className="empty-kitchen">
                    <div className="empty-kitchen-message">
                        🍽️ No hay comandas pendientes
                    </div>
                </div>
            )}

            {/* Menú contextual */}
            {contextMenu.visible && (
                <div className="context-menu-overlay" onClick={closeContextMenu}>
                    <div 
                        className="context-menu"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="context-menu-header">
                            <span className="context-menu-title">
                                {contextMenu.comanda?.Platillo || 'Comanda'}
                            </span>
                            <span className="context-menu-subtitle">
                                #{contextMenu.comanda?.OrderID} • ${contextMenu.comanda?.Precio || 0}
                            </span>
                        </div>
                        <button 
                            className="context-menu-btn context-menu-btn-delivered"
                            onClick={handleMarkAsDelivered}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Entregado
                        </button>
                        <button 
                            className="context-menu-btn context-menu-btn-delete"
                            onClick={handleDeleteComanda}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Solicitar borrado
                        </button>
                        <button 
                            className="context-menu-btn context-menu-btn-cancel"
                            onClick={closeContextMenu}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {heightDebugModalOpen && (
                <div
                    className="cnf-height-modal-overlay"
                    onPointerDown={handleHeightModalOverlayPointerDown}
                    onClick={handleHeightModalOverlayClick}
                >
                    <div className="cnf-height-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cnf-height-modal-header">
                            <div>
                                <div className="cnf-height-modal-title">Alturas y fracciones por columna</div>
                                <div className="cnf-height-modal-subtitle">
                                    Header base: 0% modelo. Header extra: {(spaceConfig.additionalOrderHeader * 100).toFixed(1)}% de columna.
                                </div>
                            </div>
                            <div className="cnf-height-modal-actions">
                                <button type="button" onClick={buildColumnHeightReport}>Actualizar</button>
                                <button type="button" onClick={() => setHeightDebugModalOpen(false)}>Cerrar</button>
                            </div>
                        </div>
                        <div className="cnf-height-modal-content">
                            <aside className="cnf-space-config-panel">
                                <div className="cnf-space-config-title">Ajustar fracciones</div>
                                <div className="cnf-space-config-subtitle">
                                    Se guarda automático en cache y se usa antes que los defaults.
                                </div>
                                <div className="cnf-space-config-fields">
                                    {SPACE_CONFIG_FIELDS.map((field) => {
                                        const percentValue = getSpaceConfigDraftValue(field);
                                        return (
                                            <label key={`${field.type}-${field.key}`} className="cnf-space-config-field">
                                                <span className="cnf-space-config-label">{field.label}</span>
                                                <span className="cnf-space-config-control">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={percentValue}
                                                        onChange={(e) => updateSpaceConfigPercent(field, e.target.value)}
                                                    />
                                                    <span>%</span>
                                                </span>
                                                <span className="cnf-space-config-fraction">
                                                    {getSpaceConfigDraftFraction(field)} de 1.000
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    className="cnf-space-config-reset"
                                    onClick={resetSpaceConfig}
                                >
                                    Restaurar defaults
                                </button>
                                <div className="cnf-space-config-json">
                                    <div className="cnf-space-config-json-title">Exportar / importar JSON</div>
                                    <div className="cnf-space-config-json-actions">
                                        <button type="button" onClick={copySpaceConfigJson}>
                                            Copiar JSON
                                        </button>
                                        <button type="button" onClick={importSpaceConfigJson}>
                                            Aplicar JSON
                                        </button>
                                    </div>
                                    <textarea
                                        value={spaceConfigJsonDraft}
                                        onChange={(e) => {
                                            setSpaceConfigJsonDraft(e.target.value);
                                            setSpaceConfigJsonMessage('');
                                        }}
                                        spellCheck={false}
                                    />
                                    {spaceConfigJsonMessage && (
                                        <div className="cnf-space-config-json-message">
                                            {spaceConfigJsonMessage}
                                        </div>
                                    )}
                                </div>
                            </aside>
                            <div className="cnf-height-modal-body">
                                {columnHeightReport.length === 0 ? (
                                    <div className="cnf-height-empty">No hay columnas visibles para medir.</div>
                                ) : (
                                    columnHeightReport.map((column, columnIndex) => (
                                        <div key={column.columnId} className="cnf-height-column-card">
                                            <div className="cnf-height-column-header">
                                                <div>
                                                    <div className="cnf-height-column-title">Columna {columnIndex + 1}</div>
                                                    <div className="cnf-height-column-id">{column.columnId}</div>
                                                </div>
                                                <div className="cnf-height-column-total">
                                                    <span>DOM: {column.totalHeightPx}px / {column.columnHeightPx}px</span>
                                                    <span>Modelo: {(column.modelUsedSpace * 100).toFixed(1)}% usado</span>
                                                    <span>Libre: {(column.modelRemainingSpace * 100).toFixed(1)}%</span>
                                                    {column.overflowPx > 0 && (
                                                        <span className="cnf-height-overflow">DOM +{column.overflowPx}px overflow</span>
                                                    )}
                                                    {column.modelOverflowSpace > 0 && (
                                                        <span className="cnf-height-overflow">Modelo +{(column.modelOverflowSpace * 100).toFixed(1)}%</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="cnf-height-elements">
                                                {column.elements.map((element, elementIndex) => (
                                                    <div key={`${element.id}-${elementIndex}`} className="cnf-height-element-row">
                                                        <div className="cnf-height-element-main">
                                                            <span className="cnf-height-element-type">{element.type}</span>
                                                            <span className="cnf-height-element-label">{element.label}</span>
                                                            <span className="cnf-height-element-id">{element.id}</span>
                                                            {element.modelNote && (
                                                                <span className="cnf-height-element-note">{element.modelNote}</span>
                                                            )}
                                                        </div>
                                                        <div className="cnf-height-element-value">
                                                            <span>{element.heightPx == null ? 'sin medir' : `${element.heightPx}px`}</span>
                                                            <span>{(element.modelSpace * 100).toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CocinaNewFeaturesKitchenBoard;
