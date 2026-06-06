import { useEffect } from 'react';

const DOC_LOCK = 'mesero-app-document-lock';
const THEME_COLOR = '#00b7e6';

function upsertMeta(name) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
    }
    return el;
}

/**
 * Bloquea scroll del documento y aplica meta tags PWA en móvil (patrón Connexiion / Flutter WebView).
 * Solo activo cuando enabled=true (vista mesero).
 */
export function useMeseroAppShell(enabled) {
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const html = document.documentElement;
        const body = document.body;
        const root = document.getElementById('root');

        html.classList.add(DOC_LOCK);
        body.classList.add(DOC_LOCK);
        root?.classList.add(DOC_LOCK);

        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const prevViewport = viewportMeta?.content ?? '';
        if (viewportMeta && !prevViewport.includes('viewport-fit=cover')) {
            viewportMeta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
        }

        const themeMeta = upsertMeta('theme-color');
        const prevTheme = themeMeta.dataset.prevContent ?? themeMeta.content;
        themeMeta.dataset.prevContent = prevTheme;
        themeMeta.content = THEME_COLOR;

        const mobileCap = upsertMeta('mobile-web-app-capable');
        const prevMobileCap = mobileCap.dataset.prevContent ?? mobileCap.content;
        mobileCap.dataset.prevContent = prevMobileCap;
        mobileCap.content = 'yes';

        const appleCap = upsertMeta('apple-mobile-web-app-capable');
        const prevAppleCap = appleCap.dataset.prevContent ?? appleCap.content;
        appleCap.dataset.prevContent = prevAppleCap;
        appleCap.content = 'yes';

        const appleStatus = upsertMeta('apple-mobile-web-app-status-bar-style');
        const prevAppleStatus = appleStatus.dataset.prevContent ?? appleStatus.content;
        appleStatus.dataset.prevContent = prevAppleStatus;
        appleStatus.content = 'black-translucent';

        return () => {
            html.classList.remove(DOC_LOCK);
            body.classList.remove(DOC_LOCK);
            root?.classList.remove(DOC_LOCK);

            if (viewportMeta && prevViewport) {
                viewportMeta.content = prevViewport;
            }

            if (themeMeta.dataset.prevContent) {
                themeMeta.content = themeMeta.dataset.prevContent;
                delete themeMeta.dataset.prevContent;
            }

            if (mobileCap.dataset.prevContent) {
                mobileCap.content = mobileCap.dataset.prevContent;
                delete mobileCap.dataset.prevContent;
            }

            if (appleCap.dataset.prevContent) {
                appleCap.content = appleCap.dataset.prevContent;
                delete appleCap.dataset.prevContent;
            }

            if (appleStatus.dataset.prevContent) {
                appleStatus.content = appleStatus.dataset.prevContent;
                delete appleStatus.dataset.prevContent;
            }
        };
    }, [enabled]);
}
