export const BIOMES = [
    {
        id: 0,
        nameEs: 'Costa',
        nameEn: 'Coast',
        ground: ['#6c7959', '#7a8a6a', '#698276'],
        sky: ['#7898af', '#d5d2bb', '#e9d8b6'],
        water: '#6b9b9c',
        sun: '#fff1cc',
    },
    {
        id: 1,
        nameEs: 'Bosque',
        nameEn: 'Forest',
        ground: ['#4a6350', '#3f5644', '#5a6e52'],
        sky: ['#6a8496', '#b8c4b0', '#d2d4c0'],
        water: '#4d7a7c',
        sun: '#f0e8c8',
    },
    {
        id: 2,
        nameEs: 'Ciudad',
        nameEn: 'City',
        ground: ['#6a6e70', '#5c6064', '#74787a'],
        sky: ['#7a8fa0', '#c5c8cc', '#d8d0c0'],
        water: '#5a7a88',
        sun: '#ffe8b0',
    },
    {
        id: 3,
        nameEs: 'Desierto',
        nameEn: 'Desert',
        ground: ['#c2a46e', '#b8955c', '#d0b478'],
        sky: ['#7eb0d0', '#e8d0a8', '#f0e0c0'],
        water: '#7aa0a8',
        sun: '#ffe6a0',
    },
    {
        id: 4,
        nameEs: 'Nieve',
        nameEn: 'Snow',
        ground: ['#d8e0e4', '#c8d2d8', '#e8eef0'],
        sky: ['#9aafc0', '#d0d8e0', '#e8ecf0'],
        water: '#7a9aaa',
        sun: '#f5f0e0',
    },
];
export function regionAt(d) {
    return Math.floor(d / 1600) % BIOMES.length;
}
export function stepEnvironment(s, forced, weather) {
    const target = regionAt(s.d);
    if (!s.discovered.includes(target)) {
        s.discovered = [...s.discovered, target];
    }
    s.regionId = target;
    // Smooth blend 0..1 within transition windows every 1600m (last 200m)
    const local = s.d % 1600;
    s.biomeBlend = local > 1400 ? (local - 1400) / 200 : 0;
    if (forced === 'auto') {
        s.environment = ['coast', 'forest', 'city', 'desert', 'snow'][target];
    }
    else {
        s.environment = forced;
    }
    s.weather = weather;
}
export function effectiveNight(env) {
    return env === 'night';
}
export function effectiveBeach(env) {
    return env === 'beach' || env === 'coast';
}
export function biomeLabel(id, en) {
    const b = BIOMES[id] || BIOMES[0];
    return en ? b.nameEn : b.nameEs;
}
