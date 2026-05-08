import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CoreChipScene } from './scenes/CoreChipScene';
import { GameScene } from './scenes/GameScene';
import { RelicScene } from './scenes/RelicScene';
import { ResultScene } from './scenes/ResultScene';
import { PvpLobbyScene } from './scenes/PvpLobbyScene';
import { PvpStarterShopScene } from './scenes/PvpStarterShopScene';
import { PvpWaitingScene } from './scenes/PvpWaitingScene';
import { PvpStageResultScene } from './scenes/PvpStageResultScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0a0a12',
    scene: [BootScene, MenuScene, CoreChipScene, GameScene, RelicScene, ResultScene, PvpLobbyScene, PvpStarterShopScene, PvpWaitingScene, PvpStageResultScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 800,
            height: 450
        },
        max: {
            width: 1920,
            height: 1080
        }
    }
};

new Phaser.Game(config);
