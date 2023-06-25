import MemoryCache from './memoryCache';

interface CooldownManagerOptions {
    usesBeforeThrottle?: number;
    decreaseUsesAfter?: number;
    cooldown?: number;
    throttleDuration?: number;
    maxConcurrent?: number;
}

type CooldownManagerItem = {
    uses: number;
    cooldownUntil: number;
    throttled: boolean;
    concurrent: number;
};

export default class CooldownManager {
    private readonly _cache: MemoryCache<CooldownManagerItem> = new MemoryCache<CooldownManagerItem>();

    private _options = {
        usesBeforeThrottle: 0,
        decreaseUsesAfter: 0,
        cooldown: 0,
        throttleDuration: 0,
        maxConcurrent: 0,
    };
    private _defaultItem: CooldownManagerItem = {
        uses: 0,
        cooldownUntil: 0,
        throttled: false,
        concurrent: 0,
    };

    constructor(options?: CooldownManagerOptions) {
        if (typeof options !== 'object') throw new TypeError('Options must be an object');

        this._options = {
            ...this._options,
            ...options,
        };

        if (
            (options.usesBeforeThrottle && typeof options.usesBeforeThrottle !== 'number') ||
            (typeof options.usesBeforeThrottle === 'number' && options.usesBeforeThrottle <= 0)
        )
            throw new TypeError('usesBeforeThrottle must be a positive number');
        if (
            (options.decreaseUsesAfter && typeof options.decreaseUsesAfter !== 'number') ||
            (typeof options.decreaseUsesAfter === 'number' && options.decreaseUsesAfter <= 0)
        )
            throw new TypeError('decreaseUsesAfter must be a positive number');
        if (
            (options.cooldown && typeof options.cooldown !== 'number') ||
            (typeof options.cooldown === 'number' && options.cooldown <= 0)
        )
            throw new TypeError('cooldown must be a positive number');
        if (
            (options.throttleDuration && typeof options.throttleDuration !== 'number') ||
            (typeof options.throttleDuration === 'number' && options.throttleDuration <= 0)
        )
            throw new TypeError('throttleDuration must be a positive number');
        if (
            (options.maxConcurrent && typeof options.maxConcurrent !== 'number') ||
            (typeof options.maxConcurrent === 'number' && options.maxConcurrent <= 0)
        )
            throw new TypeError('maxConcurrent must be a positive number');
    }

    /**
     * @description Returns the current cooldown state of the given key
     */
    public get(key: string): {
        onCooldown: boolean;
        throttled: boolean;
        cooldownFor: number;
        maxConcurrentReached: boolean;
    } {
        const current = this._cache.get(key) ?? this._defaultItem;

        return {
            onCooldown: current.cooldownUntil > Date.now(),
            throttled: current.throttled,
            cooldownFor: Math.max(current.cooldownUntil - Date.now(), 0),
            maxConcurrentReached:
                current.concurrent >= (this._options.maxConcurrent === 0 ? Infinity : this._options.maxConcurrent),
        };
    }

    /**
     * @description Adds a use to the given key
     */
    public add(key: string) {
        const current = this._cache.get(key) ?? this._defaultItem;

        current.uses++;

        if (
            current.uses >= this._options.usesBeforeThrottle &&
            this._options.throttleDuration > 0 &&
            this._options.usesBeforeThrottle > 0
        ) {
            current.uses = 0;
            current.cooldownUntil = Date.now() + this._options.throttleDuration;
            current.throttled = true;
            setTimeout(() => {
                current.throttled = false;
            }, this._options.throttleDuration);
        }

        if (!current.throttled) {
            current.concurrent++;
            current.cooldownUntil = Date.now() + this._options.cooldown;
        }

        this._cache.set(key, current);

        return this.get(key);
    }

    /**
     * @description Wraps up a usage for the given key and decreases the concurrent counter
     */
    public wrap(key: string) {
        const current = this._cache.get(key) ?? this._defaultItem;

        if (current.concurrent > 0) current.concurrent--;

        this._cache.set(key, current);

        return this.get(key);
    }
}
