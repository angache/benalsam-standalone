// ESM exports
export * from './types/index';
export * from './errors/ServiceError';
// Server-only middleware and security exports were moved to './server' entry
export * from './testing/MockFactory';
export * from './testing/TestHelpers';
// Eğer search tipi gerekiyorsa:
// export * from './types/search';
export const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
};
export const formatRelativeTime = (date) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    if (diffInSeconds < 60)
        return 'Az önce';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60)
        return `${diffInMinutes} dakika önce`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
        return `${diffInHours} saat önce`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
        return `${diffInDays} gün önce`;
    return formatDate(date);
};
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const getInitials = (name) => {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
export const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength) + '...';
};
export const getAvatarUrl = (avatarUrl, userId) => {
    if (avatarUrl)
        return avatarUrl;
    const initials = userId ? getInitials(userId) : 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=200`;
};
export const isPremiumUser = (user) => {
    if (!user)
        return false;
    if (!user.is_premium)
        return false;
    if (user.premium_expires_at) {
        const expiryDate = new Date(user.premium_expires_at);
        return expiryDate > new Date();
    }
    return true;
};
export const getTrustLevel = (trustScore) => {
    if (trustScore >= 1000)
        return 'platinum';
    if (trustScore >= 500)
        return 'gold';
    if (trustScore >= 100)
        return 'silver';
    return 'bronze';
};
export const getTrustLevelColor = (level) => {
    switch (level) {
        case 'platinum': return '#E5E4E2';
        case 'gold': return '#FFD700';
        case 'silver': return '#C0C0C0';
        case 'bronze': return '#CD7F32';
        default: return '#C0C0C0';
    }
};
export const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('90')) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
    }
    if (cleaned.length === 10 && cleaned.startsWith('5')) {
        return `+90 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
};
// CJS uyumluluğu için (opsiyonel)
if (typeof module !== 'undefined' && module.exports) {
    const types = require('./types/index');
    const errors = require('./errors/ServiceError');
    // const searchTypes = require('./types/search');
    module.exports = {
        ...types,
        ...errors,
        // ...searchTypes,
        formatPrice,
        formatDate,
        formatRelativeTime,
        validateEmail,
        getInitials,
        truncateText,
        getAvatarUrl,
        isPremiumUser,
        getTrustLevel,
        getTrustLevelColor,
        formatPhoneNumber
    };
}
//# sourceMappingURL=index.js.map