const cache = new Map();

export function cacheData(callback, tags) {
    const key = tags?.join(':') || callback.name || callback.toString();
    return async () => {
        if (cache.has(key)) return cache.get(key);
        const data = await callback();
        cache.set(key, data);
        return data;
    };
}

export function clearCacheByTag(tag) {
    for (const key of cache.keys()) {
        if (key === tag || key.startsWith(tag + ':')) {
            cache.delete(key);
        }
    }
}