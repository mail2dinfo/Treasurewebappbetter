const periodWord = (mode) => {
    const kind = String(mode || 'MONTHLY').toUpperCase();
    if (kind === 'DAILY') return 'Day';
    if (kind === 'WEEKLY') return 'Week';
    return 'Month';
};

const periodIndex = (group, iso) => {
    const start = String(group?.start_date || '').slice(0, 10);
    const date = String(iso || '').slice(0, 10);
    if (!date) return 1;
    if (!start) return 1;
    const from = new Date(`${start}T00:00:00`);
    const to = new Date(`${date}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 1;
    const kind = String(group?.mode || 'MONTHLY').toUpperCase();
    if (kind === 'DAILY') {
        const days = Math.round((to.getTime() - from.getTime()) / 86400000);
        if (Number.isNaN(days) || days < 0) return 1;
        return Math.max(1, days + 1);
    }
    if (kind === 'WEEKLY') {
        const days = Math.round((to.getTime() - from.getTime()) / 86400000);
        if (Number.isNaN(days) || days < 0) return 1;
        return Math.max(1, Math.floor(days / 7) + 1);
    }
    const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (Number.isNaN(months) || months < 0) return 1;
    return Math.max(1, months + 1);
};

export const formatDeepavaliPeriodLabel = (group, dueDate) => {
    const n = periodIndex(group, dueDate);
    return `${periodWord(group?.mode)} ${n}`;
};

export { periodWord, periodIndex };
