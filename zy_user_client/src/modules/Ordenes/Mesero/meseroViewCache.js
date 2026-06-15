const GALLERY_VIEW_KEY = 'zy-mesero-gallery-view';
const GALLERY_SELECTED_ORDER_KEY = 'zy-mesero-gallery-selected-order';
const ORDERS_VIEW_DATE_KEY = 'zy-mesero-orders-view-date';

const parseStoredDate = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d);
    if (
        date.getFullYear() !== y
        || date.getMonth() !== m - 1
        || date.getDate() !== d
    ) {
        return null;
    }
    return date;
};

export const loadGalleryViewPreference = () => {
    try {
        return localStorage.getItem(GALLERY_VIEW_KEY) === '1';
    } catch {
        return false;
    }
};

export const saveGalleryViewPreference = (isGallery) => {
    try {
        localStorage.setItem(GALLERY_VIEW_KEY, isGallery ? '1' : '0');
    } catch {
        // ignore quota / private mode
    }
};

export const loadGallerySelectedOrderId = () => {
    try {
        const raw = localStorage.getItem(GALLERY_SELECTED_ORDER_KEY);
        if (raw == null || raw === '' || raw === 'none') {
            return null;
        }
        const id = Number(raw);
        return Number.isFinite(id) ? id : null;
    } catch {
        return null;
    }
};

export const saveGallerySelectedOrderId = (orderId) => {
    try {
        if (orderId == null) {
            localStorage.setItem(GALLERY_SELECTED_ORDER_KEY, 'none');
        } else {
            localStorage.setItem(GALLERY_SELECTED_ORDER_KEY, String(orderId));
        }
    } catch {
        // ignore
    }
};

export const loadOrdersViewDate = () => {
    try {
        return parseStoredDate(localStorage.getItem(ORDERS_VIEW_DATE_KEY));
    } catch {
        return null;
    }
};

export const saveOrdersViewDate = (date) => {
    try {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        localStorage.setItem(ORDERS_VIEW_DATE_KEY, `${y}-${m}-${d}`);
    } catch {
        // ignore
    }
};

export const clearOrdersViewDate = () => {
    try {
        localStorage.removeItem(ORDERS_VIEW_DATE_KEY);
    } catch {
        // ignore
    }
};
