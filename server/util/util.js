const { DateTime } = require('luxon');

exports.getDate = () => {
    const date = DateTime.now().setZone('Africa/Nairobi');
    const offset = date.offset;
    return date.plus({minutes: offset});
}

exports.getTestingUUID = () => {
    return Math.floor(Math.random() * 10000000000 + 1);
}

exports.isNullUndefined = (val) => {
    return val === null || val === undefined;
}

exports.isEmptyObject = (val) => {
    return Object.keys(val).length === 0;
}

exports.ADVERT_STATUS = {
    // means that the current date is withing the advert's campaign period
    // and the advert should be played on devices
    active: 'ACTIVE',
    // means that the current date is earlier than the advert's campaign period
    // and the advert is waiting to be played on devices
    inactive: 'INACTIVE',
    // means that the current date is past the advert's campaign period and the
    // advert was played on devices and is now simply old data
    played: 'PLAYED'
}

exports.ADVERT_VIEWPORT = {
    LARGE: 'LARGE',
    MEDIUM: 'MEDIUM',
    SMALL: 'SMALL'
}