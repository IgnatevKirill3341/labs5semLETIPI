export interface ExchangeSettings {
    startDate: string;
    dateChangeSpeed: number;
    isTrading: boolean;
    currentDate?: string;
}
export declare class ExchangeService {
    private readonly dataPath;
    constructor();
    private ensureDataFile;
    getSettings(): ExchangeSettings;
    updateSettings(settings: Partial<ExchangeSettings>): ExchangeSettings;
    private saveSettings;
}
