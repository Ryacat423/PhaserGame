export class GameStateManager {
    private static instance: GameStateManager;
    private currentLevel: string = '';
    private gameData: any = {};
    private eventBus: Phaser.Events.EventEmitter;

    private constructor() {
        this.eventBus = new Phaser.Events.EventEmitter();
    }

    static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }

    emit(event: string, ...args: any[]) {
        this.eventBus.emit(event, ...args);
    }

    on(event: string, callback: Function, context?: any) {
        this.eventBus.on(event, callback, context);
    }

    off(event: string, callback?: Function, context?: any) {
        this.eventBus.off(event, callback, context);
    }

    setCurrentLevel(level: string) {
        this.currentLevel = level;
        this.emit('levelChanged', level);
    }

    getCurrentLevel(): string {
        return this.currentLevel;
    }

    setGameData(key: string, value: any) {
        this.gameData[key] = value;
        this.emit('gameDataChanged', key, value);
    }

    getGameData(key: string): any {
        return this.gameData[key];
    }

    reset() {
        this.gameData = {};
        this.currentLevel = '';
        this.eventBus.removeAllListeners();
    }
}