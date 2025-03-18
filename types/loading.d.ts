import { LoadingOptions } from './types';
export default class LoadingManager {
    private activeLoadings;
    private loadingTimers;
    private defaultOptions;
    constructor(options?: LoadingOptions);
    show(groupKey?: string, options?: LoadingOptions): () => void;
    hide(groupKey?: string, options?: LoadingOptions): void;
    hideAll(): void;
    private showLoading;
    private hideLoading;
}
