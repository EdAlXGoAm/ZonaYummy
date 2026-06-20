import React, { useEffect, useRef, useState } from 'react';
import './CocinadosDebugCardHeight.css';

// Temporary debug flag — remove with CocinadosDebugCardHeight.*
export const DEBUG_CNF_SHOW_CARD_HEIGHT = true;

export function useDebugCardHeight(trackKey) {
    const ref = useRef(null);
    const [heightPx, setHeightPx] = useState(null);

    useEffect(() => {
        if (!DEBUG_CNF_SHOW_CARD_HEIGHT) {
            return undefined;
        }

        const el = ref.current;
        if (!el) {
            return undefined;
        }

        const measure = () => {
            requestAnimationFrame(() => {
                if (!ref.current) {
                    return;
                }
                setHeightPx(Math.round(ref.current.getBoundingClientRect().height));
            });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [trackKey]);

    return { ref, heightPx };
}

export function DebugCardHeightBadge({ heightPx, variant = 'default' }) {
    if (!DEBUG_CNF_SHOW_CARD_HEIGHT || heightPx == null) {
        return null;
    }

    return (
        <span
            className={`cnf-debug-card-height cnf-debug-card-height--${variant}`}
            aria-hidden="true"
        >
            {heightPx}px
        </span>
    );
}

export function DebugCardHeightShell({
    trackKey,
    className = '',
    style,
    onContextMenu,
    badgeVariant = 'default',
    children,
}) {
    const { ref, heightPx } = useDebugCardHeight(trackKey);

    return (
        <div
            ref={DEBUG_CNF_SHOW_CARD_HEIGHT ? ref : null}
            className={className}
            style={style}
            onContextMenu={onContextMenu}
        >
            <DebugCardHeightBadge heightPx={heightPx} variant={badgeVariant} />
            {children}
        </div>
    );
}
