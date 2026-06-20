export const CHANNEL_MOSTRADOR = 'mostrador';
export const CHANNEL_WHATSAPP = 'WhatsApp';
export const FULFILLMENT_MOSTRADOR = 'mostrador';
export const FULFILLMENT_DOMICILIO = 'domicilio';

export const DEFAULT_ORIGEN = `${CHANNEL_MOSTRADOR}-${FULFILLMENT_MOSTRADOR}`;

export const parseOrigen = (origen) => {
    const raw = (origen || '').trim();
    if (!raw) {
        return {
            channel: CHANNEL_MOSTRADOR,
            fulfillment: FULFILLMENT_MOSTRADOR,
        };
    }

    if (raw === 'Whatsapp' || raw === 'WhatsApp') {
        return {
            channel: CHANNEL_WHATSAPP,
            fulfillment: FULFILLMENT_MOSTRADOR,
        };
    }

    const parts = raw.split('-');
    if (parts.length === 2) {
        const channelPart = parts[0].toLowerCase();
        const fulfillmentPart = parts[1].toLowerCase();
        return {
            channel: channelPart === 'whatsapp' ? CHANNEL_WHATSAPP : CHANNEL_MOSTRADOR,
            fulfillment: fulfillmentPart === 'domicilio'
                ? FULFILLMENT_DOMICILIO
                : FULFILLMENT_MOSTRADOR,
        };
    }

    return {
        channel: CHANNEL_MOSTRADOR,
        fulfillment: FULFILLMENT_MOSTRADOR,
    };
};

export const formatOrigen = ({ channel, fulfillment }) => {
    const normalizedChannel = channel === CHANNEL_WHATSAPP
        ? CHANNEL_WHATSAPP
        : CHANNEL_MOSTRADOR;
    const normalizedFulfillment = fulfillment === FULFILLMENT_DOMICILIO
        ? FULFILLMENT_DOMICILIO
        : FULFILLMENT_MOSTRADOR;

    return `${normalizedChannel}-${normalizedFulfillment}`;
};

export const isOrigenWhatsapp = (origen) => (
    parseOrigen(origen).channel === CHANNEL_WHATSAPP
);

export const isOrigenDomicilio = (origen) => (
    parseOrigen(origen).fulfillment === FULFILLMENT_DOMICILIO
);

export const getOrigenSummary = (origen) => {
    const { channel, fulfillment } = parseOrigen(origen);
    const channelLabel = channel === CHANNEL_WHATSAPP ? 'WhatsApp' : 'Mostrador';
    const fulfillmentLabel = fulfillment === FULFILLMENT_DOMICILIO
        ? 'Envío a domicilio'
        : 'Recoger en mostrador';
    return `${channelLabel} · ${fulfillmentLabel}`;
};
