export const BIOMES = [
    {
        id: 0,
        nameEs: 'Costa',
        nameEn: 'Coast',
        ground: ['#5f7a58', '#6e8a64', '#4f6e62'],
        sky: ['#5a8db0', '#c8d8e0', '#e8dcc4'],
        water: '#4a8a96',
        sun: '#ffe8b8',
        haze: '#d8e4e888',
    },
    {
        id: 1,
        nameEs: 'Bosque',
        nameEn: 'Forest',
        ground: ['#3a5642', '#2e4838', '#4a6350'],
        sky: ['#5a7488', '#a8b8a8', '#c8c8b0'],
        water: '#3a6a6c',
        sun: '#f0e4b8',
        haze: '#b8c4b888',
    },
    {
        id: 2,
        nameEs: 'Ciudad',
        nameEn: 'City',
        ground: ['#5a5e62', '#4e5256', '#686c70'],
        sky: ['#6a8090', '#b8c0c8', '#d0c8b8'],
        water: '#4a6a78',
        sun: '#ffe0a0',
        haze: '#c0c8d088',
    },
    {
        id: 3,
        nameEs: 'Desierto',
        nameEn: 'Desert',
        ground: ['#c4a46a', '#b89254', '#d4b878'],
        sky: ['#6aa8d0', '#e0c8a0', '#f0dcc0'],
        water: '#6a98a0',
        sun: '#ffd890',
        haze: '#e8d8b888',
    },
    {
        id: 4,
        nameEs: 'Nieve',
        nameEn: 'Snow',
        ground: ['#e0e8ec', '#d0dae0', '#f0f4f6'],
        sky: ['#8aa4b8', '#c8d4e0', '#e8eef4'],
        water: '#6a8aa0',
        sun: '#f8f4e8',
        haze: '#d8e4f088',
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
