import {unstable_cache} from "next/cache";

type Callback = (...args: any[]) => Promise<any>;

const isDev = process.env.NODE_ENV === 'development'

export function withCache<T extends Callback>(cb: T, keyparts? : string[],  options?: {revalidate?: number | false, tags?: string[]} ): T { return isDev ? cb : unstable_cache(cb, keyparts, options); }
