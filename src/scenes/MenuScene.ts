import Phaser from 'phaser';
import { COLORS } from '../constants';
import { createInitialState } from '../store';
import { generatePlayerCode, getPlayerLabel, getPlayerProfile, isValidProfile, savePlayerProfile } from '../playerProfile';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        if (!getPlayerProfile()) {
            this.renderProfileForm(container);
            return;
        }
        container.innerHTML = `
            <div class="menu-container">
                <div class="menu-title">过载回路</div>
                <div class="menu-subtitle">Overload Circuit</div>
                <div class="menu-player">当前玩家：<span class="history-value">${getPlayerLabel()}</span></div>
                <div class="menu-history">
                    <div class="history-item">最高到达层数: <span class="history-value">${this.getHistory().highestStage || 0}</span></div>
                    <div class="history-item">最高单回合分: <span class="history-value">${this.getHistory().highestRoundScore.toLocaleString() || 0}</span></div>
                    <div class="history-item">历史最高总分: <span class="history-value">${this.getHistory().highestTotalScore.toLocaleString() || 0}</span></div>
                </div>
                <div class="menu-buttons">
                    <button class="btn primary" id="btn-start">开始游戏</button>
                    <button class="btn success" id="btn-pvp">联机模式</button>
                    <button class="btn secondary" id="btn-leaderboard">排行榜</button>
                    <button class="btn secondary" id="btn-rename">修改昵称</button>
                </div>
            </div>
        `;

        const startBtn = document.getElementById('btn-start')!;
        startBtn.addEventListener('click', () => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '220px 1fr 220px';
            const state = createInitialState();
            this.scene.start('GameScene', { state });
        });

        const pvpBtn = document.getElementById('btn-pvp')!;
        pvpBtn.addEventListener('click', () => {
            this.scene.start('PvpLobbyScene');
        });

        document.getElementById('btn-leaderboard')!.addEventListener('click', () => {
            this.scene.start('LeaderboardScene');
        });

        document.getElementById('btn-rename')!.addEventListener('click', () => {
            this.renderProfileForm(container, true);
        });
    }

    private renderProfileForm(container: HTMLElement, editing = false): void {
        const profile = getPlayerProfile();
        const displayName = profile?.displayName || '玩家';
        const playerCode = profile?.playerCode || generatePlayerCode();
        container.innerHTML = `
            <div class="menu-container">
                <div class="menu-title">过载回路</div>
                <div class="menu-subtitle">${editing ? '修改玩家档案' : '创建玩家档案'}</div>
                <div class="profile-form">
                    <label>昵称<input id="profile-name" maxlength="8" value="${displayName}" /></label>
                    <label>编号<input id="profile-code" maxlength="4" value="${playerCode}" inputmode="numeric" /></label>
                    <div class="profile-hint">显示格式为 昵称#编号，昵称最多 8 个字符，编号为四位数字。</div>
                    <button class="btn primary" id="btn-profile-save">确认</button>
                    ${editing ? '<button class="btn secondary" id="btn-profile-cancel">取消</button>' : ''}
                </div>
            </div>
        `;
        document.getElementById('btn-profile-cancel')?.addEventListener('click', () => {
            this.scene.restart();
        });
        document.getElementById('btn-profile-save')!.addEventListener('click', () => {
            const displayName = ((document.getElementById('profile-name') as HTMLInputElement).value || '玩家').trim().slice(0, 8);
            const playerCode = ((document.getElementById('profile-code') as HTMLInputElement).value || '').trim();
            const profile = { displayName, playerCode };
            if (!isValidProfile(profile)) {
                alert('请填写昵称，并确保编号为四位数字。');
                return;
            }
            savePlayerProfile(profile);
            this.scene.restart();
        });
    }

    private getHistory() {
        try {
            const raw = localStorage.getItem('overload_circuit_history');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch {
        }
        return { highestStage: 0, highestRoundScore: 0, highestTotalScore: 0 };
    }
}
