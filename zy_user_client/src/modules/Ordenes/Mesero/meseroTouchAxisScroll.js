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

// Known scroll roots per axis; used to decide if an exempt-ish element
// actually belongs to the container being scrolled.
const SCROLL_ROOT_SELECTOR_BY_AXIS = {
    x: '.mesero-order-panel__comandas-track, .mesero-gallery__filmstrip-scroll',
    y: '[data-mesero-select-menu], [data-mesero-platillo-scroll], .mesero-order-panel__comanda-scroll',
};

function allowsScrollFromInteractive(target, container) {
    // Axis locking plus the tap threshold keep clicks working, so gestures
    // starting on interactive children may still scroll their own container.
    return target instanceof Element && container.contains(target);
}

function isTouchScrollExempt(target, container, axis = 'x', extraExemptSelector = '') {
    if (!(target instanceof Element)) {
        return true;
    }

    const selectors = extraExemptSelector
        ? `${STATIC_EXEMPT_SELECTOR}, ${extraExemptSelector}`
        : STATIC_EXEMPT_SELECTOR;

    if (target.closest(INTERACTIVE_EXEMPT_SELECTOR)) {
        if (!allowsScrollFromInteractive(target, container)) {
            return true;
        }
    }

    if (target.closest(selectors)) {
        if (container.contains(target)) {
            const scrollRoot = target.closest(
                SCROLL_ROOT_SELECTOR_BY_AXIS[axis] ?? SCROLL_ROOT_SELECTOR_BY_AXIS.y,
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

// Only flicks released faster than this start momentum (px/ms).
const MOMENTUM_LAUNCH_VELOCITY = 0.15;
// Recent-move window used to estimate the release velocity (ms).
const VELOCITY_SAMPLE_WINDOW_MS = 100;
// Cap frame delta so a hiccup (tab switch, GC) doesn't teleport the scroll.
const MOMENTUM_MAX_FRAME_MS = 50;

// Touch axis lock for one scroll container (horizontal track or vertical panel/menu).
// Includes iOS-like kinetic scrolling: the flick velocity decays exponentially
// after release (`friction` is the decay time constant in ms).
export function bindTouchAxisScroll(container, {
    axis = 'x',
    threshold = 6,
    exemptSelector = '',
    momentum = true,
    friction = 325,
    minVelocity = 0.05,
} = {}) {
    if (!container) {
        return () => {};
    }

    const lockThreshold = axis === 'x' ? Math.min(threshold, 4) : threshold;
    const scrollProp = axis === 'x' ? 'scrollLeft' : 'scrollTop';

    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let startScrollTop = 0;
    let active = false;
    let locked = null;
    let exempt = false;

    let samples = [];
    let momentumFrame = null;
    let momentumVelocity = 0; // px/ms, in scroll-position terms
    let momentumPos = 0; // float position, avoids scrollLeft rounding drift
    let momentumLastTime = 0;

    const stopMomentum = () => {
        if (momentumFrame != null) {
            cancelAnimationFrame(momentumFrame);
            momentumFrame = null;
        }
        momentumVelocity = 0;
    };

    const maxScroll = () => (axis === 'x'
        ? container.scrollWidth - container.clientWidth
        : container.scrollHeight - container.clientHeight);

    const stepMomentum = (now) => {
        momentumFrame = null;
        const dt = Math.min(now - momentumLastTime, MOMENTUM_MAX_FRAME_MS);
        momentumLastTime = now;

        momentumVelocity *= Math.exp(-dt / friction);
        momentumPos += momentumVelocity * dt;

        const limit = Math.max(0, maxScroll());
        const clamped = Math.max(0, Math.min(limit, momentumPos));
        const hitEdge = clamped !== momentumPos;
        momentumPos = clamped;
        container[scrollProp] = momentumPos;

        if (hitEdge || Math.abs(momentumVelocity) < minVelocity) {
            stopMomentum();
            return;
        }
        momentumFrame = requestAnimationFrame(stepMomentum);
    };

    const startMomentum = (velocity) => {
        momentumVelocity = velocity;
        momentumPos = container[scrollProp];
        momentumLastTime = performance.now();
        momentumFrame = requestAnimationFrame(stepMomentum);
    };

    const recordSample = () => {
        const now = performance.now();
        samples.push({ t: now, pos: container[scrollProp] });
        while (samples.length > 1 && now - samples[0].t > VELOCITY_SAMPLE_WINDOW_MS) {
            samples.shift();
        }
    };

    const releaseVelocity = () => {
        if (samples.length < 2) {
            return 0;
        }
        const first = samples[0];
        const last = samples[samples.length - 1];
        const elapsed = last.t - first.t;
        // A pause before lifting the finger means no remaining velocity.
        if (elapsed <= 0 || performance.now() - last.t > VELOCITY_SAMPLE_WINDOW_MS) {
            return 0;
        }
        return (last.pos - first.pos) / elapsed;
    };

    const onStart = (event) => {
        if (event.touches?.length !== 1) {
            return;
        }
        // Touching the surface grabs and stops any ongoing inertia.
        stopMomentum();
        samples = [];
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
        recordSample();
        event.preventDefault();
    };

    const onEnd = () => {
        const shouldLaunch = momentum && active && locked;
        active = false;
        locked = null;
        exempt = false;

        if (shouldLaunch) {
            const velocity = releaseVelocity();
            if (Math.abs(velocity) >= MOMENTUM_LAUNCH_VELOCITY) {
                startMomentum(velocity);
            }
        }
        samples = [];
    };

    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: false });
    container.addEventListener('touchend', onEnd, { passive: true });
    container.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
        stopMomentum();
        container.removeEventListener('touchstart', onStart);
        container.removeEventListener('touchmove', onMove);
        container.removeEventListener('touchend', onEnd);
        container.removeEventListener('touchcancel', onEnd);
    };
}
