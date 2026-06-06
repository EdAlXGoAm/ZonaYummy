const GALLERY_VIEW_KEY = 'zy-mesero-gallery-view';
const GALLERY_SELECTED_ORDER_KEY = 'zy-mesero-gallery-selected-order';

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
