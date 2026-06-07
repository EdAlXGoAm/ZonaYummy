const STATIC_EXEMPT_SELECTOR = [
    '[data-touch-scroll-exempt]',
    '[data-mesero-select-menu]',
    '.platillo-modal',
    '.platillo-modal-overlay',
    '.mesero-order-pick',
    '.mesero-order-pick-overlay',
    '.mesero-dropdown-wrap',
    '[class*="menu"]',
    '[class*="Menu"]',
    '[id*="react-select"]',
    '.two-option-switch',
    'textarea',
    'input',
    'select',
    'button',
    'a',
    'label',
].join(', ');

const INTERACTIVE_EXEMPT_SELECTOR = [
    'button',
    'input',
    'select',
    'textarea',
    'a',
    'label',
    '.two-option-switch',
    '.mesero-dropdown-wrap',
].join(', ');

function allowsVerticalScrollFromInteractive(target, container, axis) {
    return axis === 'y'
        && target instanceof Element
        && container.contains(target);
}

function isTouchScrollExempt(target, container, axis = 'x', extraExemptSelector = '') {
    if (!(target instanceof Element)) {
        return true;
    }

    const selectors = extraExemptSelector
        ? `${STATIC_EXEMPT_SELECTOR}, ${extraExemptSelector}`
        : STATIC_EXEMPT_SELECTOR;

    if (target.closest(INTERACTIVE_EXEMPT_SELECTOR)) {
        if (!allowsVerticalScrollFromInteractive(target, container, axis)) {
            return true;
        }
    }

    if (target.closest(selectors)) {
        if (container.contains(target)) {
            const scrollRoot = target.closest(
                '[data-mesero-select-menu], [data-mesero-platillo-scroll], .mesero-order-panel__comanda-scroll',
            );
            if (scrollRoot === container) {
                return false;
            }
        }
        return true;
    }

    let node = target;
    while (node && node !== container) {
        if (!(node instanceof Element)) {
            break;
        }
        const style = window.getComputedStyle(node);
        const scrollableY = (style.overflowY === 'auto' || style.overflowY === 'scroll')
            && node.scrollHeight > node.clientHeight + 1;
        const scrollableX = (style.overflowX === 'auto' || style.overflowX === 'scroll')
            && node.scrollWidth > node.clientWidth + 1;

        if (scrollableX || (scrollableY && axis === 'y')) {
            return node !== container;
        }
        node = node.parentElement;
    }

    return false;
}

// Touch axis lock for one scroll container (horizontal track or vertical panel/menu).
export function bindTouchAxisScroll(container, { axis = 'x', threshold = 6, exemptSelector = '' } = {}) {
    if (!container) {
        return () => {};
    }

    const lockThreshold = axis === 'x' ? Math.min(threshold, 4) : threshold;

    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let startScrollTop = 0;
    let active = false;
    let locked = null;
    let exempt = false;

    const onStart = (event) => {
        if (event.touches?.length !== 1) {
            return;
        }
        exempt = isTouchScrollExempt(event.target, container, axis, exemptSelector);
        if (exempt) {
            active = false;
            return;
        }
        active = true;
        locked = null;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        startScrollLeft = container.scrollLeft;
        startScrollTop = container.scrollTop;
    };

    const onMove = (event) => {
        if (!active || exempt || event.touches?.length !== 1) {
            return;
        }

        const dx = event.touches[0].clientX - startX;
        const dy = event.touches[0].clientY - startY;

        if (locked == null && (Math.abs(dx) > lockThreshold || Math.abs(dy) > lockThreshold)) {
            locked = axis === 'x'
                ? Math.abs(dx) > Math.abs(dy)
                : Math.abs(dy) >= Math.abs(dx);
        }

        if (!locked) {
            return;
        }

        if (axis === 'x') {
            container.scrollLeft = startScrollLeft - dx;
        } else {
            container.scrollTop = startScrollTop - dy;
        }
        event.preventDefault();
    };

    const onEnd = () => {
        active = false;
        locked = null;
        exempt = false;
    };

    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: false });
    container.addEventListener('touchend', onEnd, { passive: true });
    container.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
        container.removeEventListener('touchstart', onStart);
        container.removeEventListener('touchmove', onMove);
        container.removeEventListener('touchend', onEnd);
        container.removeEventListener('touchcancel', onEnd);
    };
}
