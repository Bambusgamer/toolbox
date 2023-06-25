type CachedItem<Item> = {
    value: Item;
    lastAccessed: number;
};

type Options<Item> = {
    maxSize?: number | typeof Infinity | null;
    maxAge?: number | typeof Infinity | null;
    maxAgeSweepInterval?: number | null;
    sweeper?: (item: CachedItem<Item>) => boolean;
    sweeperInterval?: number | null;
};

type CompiledOptions<Item> = {
    maxSize: number;
    maxAge: number;
    maxAgeSweepInterval: number;
    sweeper: (item: CachedItem<Item>) => boolean;
    sweeperInterval: number;
};

export default class MemoryCache<Item> {
    private readonly _cache: Map<string, Item> = new Map();
    private readonly _cacheAccessHistory: Map<string, number> = new Map();
    private _options: CompiledOptions<Item> = {
        maxSize: 0,
        maxAge: 0,
        maxAgeSweepInterval: 1,
        sweeper: () => true,
        sweeperInterval: 1,
    };

    private _maxAgeSweeper: NodeJS.Timer | null = null;
    private _sweeper: NodeJS.Timer | null = null;

    constructor(
        options: Options<Item> = {
            maxSize: Infinity,
            maxAge: Infinity,
            maxAgeSweepInterval: 0,
            sweeper: () => true,
            sweeperInterval: 0,
        },
    ) {
        if (
            (options.maxAge && typeof options.maxAge !== 'number') ||
            (typeof options.maxAge === 'number' && options.maxAge <= 0)
        )
            this._options.maxAge = 0;
        if (
            (options.maxSize && typeof options.maxSize !== 'number') ||
            (typeof options.maxSize === 'number' && options.maxSize <= 0)
        )
            this._options.maxSize = 0;
        if (
            (options.maxAgeSweepInterval && typeof options.maxAgeSweepInterval !== 'number') ||
            (typeof options.maxAgeSweepInterval === 'number' && options.maxAgeSweepInterval <= 0)
        )
            this._options.maxAgeSweepInterval = 0;
        if (
            (options.sweeperInterval && typeof options.sweeperInterval !== 'number') ||
            (typeof options.sweeperInterval === 'number' && options.sweeperInterval <= 0)
        )
            this._options.sweeperInterval = 0;
        if (options.sweeper && typeof options.sweeper !== 'function') this._options.sweeper = () => true;

        if (this._options.maxAge > 0 && this._options.maxAgeSweepInterval > 0) {
            this._maxAgeSweeper = setInterval(() => {
                this.filter((item) => item.lastAccessed + this._options.maxAge < Date.now());
            }, this._options.maxAgeSweepInterval);
        }

        if (this._options.sweeper && this._options.sweeperInterval > 0) {
            this._sweeper = setInterval(() => {
                this.filter(this._options.sweeper);
            }, this._options.sweeperInterval);
        }
    }

    /**
     * @description Deletes the least recently used item from the cache
     */
    private deleteOldest() {
        const oldest = [...this._cacheAccessHistory].sort((a, b) => a[1] - b[1])[0];
        this._cache.delete(oldest[0]);
        this._cacheAccessHistory.delete(oldest[0]);
    }

    /**
     * @description Enforces the max size of the cache
     */
    private enforceMaxSize() {
        if (this._options.maxSize === 0) return;

        while (this._cache.size > this._options.maxSize) {
            this.deleteOldest();
        }
    }

    /**
     * @description Returns an item from the cache
     */
    public get(key: string) {
        const cached = this._cache.get(key);

        if (!cached) return null;

        this._cacheAccessHistory.set(key, Date.now());
        return cached;
    }

    /**
     * @description Sets an item in the cache
     */
    public set(key: string, value: Item) {
        this._cache.set(key, value);
        this._cacheAccessHistory.set(key, Date.now());

        this.enforceMaxSize();
    }

    /**
     * @description Checks if an item exists in the cache
     */
    public has(key: string) {
        if (!this._cache.has(key)) return false;

        this._cacheAccessHistory.set(key, Date.now());
        return true;
    }

    /**
     * @description Deletes an item from the cache
     */
    public delete(key: string) {
        this._cache.delete(key);
        this._cacheAccessHistory.delete(key);
    }

    /**
     * @description Clears the cache
     */
    public clear() {
        this._cache.clear();
        this._cacheAccessHistory.clear();
    }

    /**
     * @description Returns the size of the cache
     */
    public get size() {
        return this._cache.size;
    }

    /**
     * @description Returns an array of the cache
     */
    public toArray(): [string, Item, number][] {
        const array: [string, Item, number][] = [];

        for (const [key, value] of this._cache) {
            array.push([key, value, this._cacheAccessHistory.get(key)!]);
        }

        return array;
    }

    /**
     * @description Returns an array of all cache keys
     */
    public keys() {
        return [...this._cache.keys()];
    }

    /**
     * @description Returns an array of all cache values
     */
    public values() {
        return [...this._cache.values()];
    }

    /**
     * @description Fills the cache with the given array or MemoryCache instance
     */
    public from(input: [string, Item, number][] | MemoryCache<Item>) {
        if (input instanceof MemoryCache) {
            const array = input.toArray();
            for (const [key, value, lastAccessed] of array) {
                this._cache.set(key, value);
                this._cacheAccessHistory.set(key, lastAccessed);
            }
        } else {
            for (const [key, value, lastAccessed] of input) {
                this._cache.set(key, value);
                this._cacheAccessHistory.set(key, lastAccessed);
            }
        }
    }

    /**
     * @description Destroys the cache
     */
    public destroy() {
        if (this._maxAgeSweeper) clearInterval(this._maxAgeSweeper);
        if (this._sweeper) clearInterval(this._sweeper);
        this._cache.clear();
        this._cacheAccessHistory.clear();
    }

    /**
     * @description Filters the cache by the given callback
     */
    public filter(callback: (item: CachedItem<Item>) => boolean): void {
        for (const [key, value] of [...this._cache]) {
            if (!callback({ value, lastAccessed: this._cacheAccessHistory.get(key) ?? Date.now() })) {
                this._cache.delete(key);
                this._cacheAccessHistory.delete(key);
            }
        }
    }
}
