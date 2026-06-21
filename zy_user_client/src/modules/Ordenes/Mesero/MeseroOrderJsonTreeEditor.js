import React, { useCallback, useMemo, useState } from 'react';
import './MeseroOrderJsonTreeEditor.css';

const pathKey = (path) => path.join('.');

const cloneAtPath = (root, path, nextValue) => {
    const clone = JSON.parse(JSON.stringify(root));
    let current = clone;
    for (let i = 0; i < path.length - 1; i += 1) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = nextValue;
    return clone;
};

const deleteAtPath = (root, path) => {
    if (path.length === 0) {
        return root;
    }
    const clone = JSON.parse(JSON.stringify(root));
    let parent = clone;
    for (let i = 0; i < path.length - 1; i += 1) {
        parent = parent[path[i]];
    }
    const lastKey = path[path.length - 1];
    if (Array.isArray(parent)) {
        parent.splice(Number(lastKey), 1);
    } else {
        delete parent[lastKey];
    }
    return clone;
};

const collectCollapsiblePaths = (value, path = [], acc = new Set()) => {
    if (Array.isArray(value)) {
        if (path.length > 0) acc.add(pathKey(path));
        value.forEach((item, index) => collectCollapsiblePaths(item, [...path, index], acc));
        return acc;
    }
    if (value !== null && typeof value === 'object') {
        if (path.length > 0) acc.add(pathKey(path));
        Object.keys(value).forEach((key) => {
            collectCollapsiblePaths(value[key], [...path, key], acc);
        });
    }
    return acc;
};

const collectArrayPaths = (value, path = [], acc = new Set()) => {
    if (Array.isArray(value)) {
        if (path.length > 0) acc.add(pathKey(path));
        value.forEach((item, index) => collectArrayPaths(item, [...path, index], acc));
        return acc;
    }
    if (value !== null && typeof value === 'object') {
        Object.keys(value).forEach((key) => collectArrayPaths(value[key], [...path, key], acc));
    }
    return acc;
};

const getDefaultCollapsedPaths = (value) => {
    const collapsed = new Set();
    if (Array.isArray(value?.ComandasList)) {
        collapsed.add('ComandasList');
        value.ComandasList.forEach((_, index) => collapsed.add(`ComandasList.${index}`));
    }
    if (Array.isArray(value?.pagos)) {
        collapsed.add('pagos');
    }
    return collapsed;
};

const formatPreview = (value) => {
    if (Array.isArray(value)) return `[ ${value.length} items ]`;
    if (value !== null && typeof value === 'object') {
        const count = Object.keys(value).length;
        return `{ ${count} ${count === 1 ? 'key' : 'keys'} }`;
    }
    return String(value);
};

const JsonPrimitiveEditor = ({ value, onChange }) => {
    if (typeof value === 'boolean') {
        return (
            <select
                className="mesero-order-json-tree__input mesero-order-json-tree__input--select"
                value={value ? 'true' : 'false'}
                onChange={(e) => onChange(e.target.value === 'true')}
            >
                <option value="true">true</option>
                <option value="false">false</option>
            </select>
        );
    }

    if (value === null) {
        return <span className="mesero-order-json-tree__null">null</span>;
    }

    if (typeof value === 'number') {
        return (
            <input
                type="number"
                className="mesero-order-json-tree__input"
                value={Number.isFinite(value) ? value : ''}
                onChange={(e) => {
                    const raw = e.target.value;
                    onChange(raw === '' ? 0 : Number(raw));
                }}
            />
        );
    }

    return (
        <input
            type="text"
            className="mesero-order-json-tree__input mesero-order-json-tree__input--string"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
        />
    );
};

const JsonNode = ({
    name,
    value,
    path,
    depth,
    collapsedPaths,
    onToggleCollapse,
    onValueChange,
    onDelete,
}) => {
    const isArray = Array.isArray(value);
    const isObject = value !== null && typeof value === 'object' && !isArray;
    const isCollapsible = isArray || isObject;
    const currentPathKey = pathKey(path);
    const isCollapsed = isCollapsible && collapsedPaths.has(currentPathKey);
    const label = name === null ? '(root)' : (isArray ? `[${name}]` : `"${name}"`);
    const canDelete = path.length > 0;

    const handleDelete = () => {
        const targetLabel = name === null ? 'este nodo' : String(label);
        const confirmDelete = window.confirm(`¿Eliminar ${targetLabel} del JSON?`);
        if (!confirmDelete) {
            return;
        }
        onDelete(path);
    };

    const deleteButton = canDelete ? (
        <button
            type="button"
            className="mesero-order-json-tree__delete"
            onClick={handleDelete}
            aria-label={`Eliminar ${label}`}
            title="Eliminar"
        >
            ✕
        </button>
    ) : null;

    if (!isCollapsible) {
        return (
            <div className="mesero-order-json-tree__row" style={{ paddingLeft: `${depth * 14}px` }}>
                <span className="mesero-order-json-tree__key">{label}</span>
                <span className="mesero-order-json-tree__sep">:</span>
                <JsonPrimitiveEditor
                    value={value}
                    onChange={(next) => onValueChange(path, next)}
                />
                {deleteButton}
            </div>
        );
    }

    const entries = isArray
        ? value.map((item, index) => [index, item])
        : Object.entries(value);

    return (
        <div className="mesero-order-json-tree__branch">
            <div
                className="mesero-order-json-tree__row mesero-order-json-tree__row--collapsible"
                style={{ paddingLeft: `${depth * 14}px` }}
            >
                <button
                    type="button"
                    className={`mesero-order-json-tree__toggle${isCollapsed ? ' mesero-order-json-tree__toggle--collapsed' : ''}`}
                    onClick={() => onToggleCollapse(currentPathKey)}
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
                >
                    ▾
                </button>
                <span className="mesero-order-json-tree__key">{label}</span>
                <span className="mesero-order-json-tree__sep">:</span>
                {isCollapsed ? (
                    <span className="mesero-order-json-tree__preview">{formatPreview(value)}</span>
                ) : (
                    <span className="mesero-order-json-tree__open">{isArray ? '[' : '{'}</span>
                )}
                {deleteButton}
            </div>

            {!isCollapsed && (
                <>
                    {entries.map(([entryKey, entryValue]) => (
                        <JsonNode
                            key={`${currentPathKey}.${entryKey}`}
                            name={entryKey}
                            value={entryValue}
                            path={[...path, entryKey]}
                            depth={depth + 1}
                            collapsedPaths={collapsedPaths}
                            onToggleCollapse={onToggleCollapse}
                            onValueChange={onValueChange}
                            onDelete={onDelete}
                        />
                    ))}
                    <div
                        className="mesero-order-json-tree__row mesero-order-json-tree__row--close"
                        style={{ paddingLeft: `${depth * 14}px` }}
                    >
                        <span className="mesero-order-json-tree__open">{isArray ? ']' : '}'}</span>
                    </div>
                </>
            )}
        </div>
    );
};

const MeseroOrderJsonTreeEditor = ({ value, onChange }) => {
    const [collapsedPaths, setCollapsedPaths] = useState(() => getDefaultCollapsedPaths(value));

    const allCollapsiblePaths = useMemo(() => collectCollapsiblePaths(value), [value]);
    const arrayPaths = useMemo(() => collectArrayPaths(value), [value]);

    const handleToggleCollapse = useCallback((key) => {
        setCollapsedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const handleExpandAll = useCallback(() => {
        setCollapsedPaths(new Set());
    }, []);

    const handleCollapseAll = useCallback(() => {
        setCollapsedPaths(new Set(allCollapsiblePaths));
    }, [allCollapsiblePaths]);

    const handleCollapseArrays = useCallback(() => {
        setCollapsedPaths(new Set(arrayPaths));
    }, [arrayPaths]);

    const handleValueChange = useCallback((path, nextValue) => {
        onChange(cloneAtPath(value, path, nextValue));
    }, [onChange, value]);

    const handleDelete = useCallback((path) => {
        onChange(deleteAtPath(value, path));
    }, [onChange, value]);

    return (
        <div className="mesero-order-json-tree">
            <div className="mesero-order-json-tree__toolbar">
                <button type="button" className="mesero-order-json-tree__tool" onClick={handleExpandAll}>
                    Expandir todo
                </button>
                <button type="button" className="mesero-order-json-tree__tool" onClick={handleCollapseAll}>
                    Colapsar todo
                </button>
                <button type="button" className="mesero-order-json-tree__tool" onClick={handleCollapseArrays}>
                    Colapsar listas
                </button>
            </div>
            <div className="mesero-order-json-tree__scroll">
                <JsonNode
                    name={null}
                    value={value}
                    path={[]}
                    depth={0}
                    collapsedPaths={collapsedPaths}
                    onToggleCollapse={handleToggleCollapse}
                    onValueChange={handleValueChange}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
};

export default MeseroOrderJsonTreeEditor;
