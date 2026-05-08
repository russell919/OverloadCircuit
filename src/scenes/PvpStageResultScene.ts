import Phaser from 'phaser';
import { COLORS } from '../constants';
import { GamePhase, GameState, PvpGoldRewardBreakdown, PvpStagePlayerResult, PvpStageResult } from '../types';

export class PvpStageResultScene extends Phaser.Scene {
    private state!: GameState;
    private result!: PvpStageResult;

    constructor() {
        super({ key: 'PvpStageResultScene' });
    }

    init(data: { state: GameState; result: PvpStageResult }): void {
        this.state = data.state;
        this.result = data.result;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        const reward = this.applyGoldReward();

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = `
            <div class="pvp-result-container">
                <div class="pvp-result-title">${this.getTitle()}</div>
                <div class="pvp-scoreboard">
                    ${this.result.players.map(player => this.renderPlayerResult(player)).join('')}
                </div>
                <div class="pvp-match-score">
                    胜点比分：${this.getScoreText()}
                </div>
                <div class="pvp-reward-panel">
                    <div>金币奖励：+${reward.total}</div>
                    <span>基础 ${reward.base}</span>
                    ${reward.loserCompensation > 0 ? `<span>败方补偿 ${reward.loserCompensation}</span>` : ''}
                    ${reward.lagCompensation > 0 ? `<span>落后补偿 ${reward.lagCompensation}</span>` : ''}
                    <strong>当前金币 ${this.state.gold}</strong>
                </div>
                <div class="pvp-result-actions">
                    ${this.result.gameOver
                        ? '<button class="btn primary" id="btn-pvp-menu">返回主菜单</button>'
                        : '<button class="btn primary" id="btn-pvp-continue">进入遗物与商店</button>'}
                </div>
            </div>
        `;

        const menuBtn = document.getElementById('btn-pvp-menu');
        menuBtn?.addEventListener('click', () => this.scene.start('MenuScene'));

        const continueBtn = document.getElementById('btn-pvp-continue');
        continueBtn?.addEventListener('click', () => {
            this.state.phase = GamePhase.STAGE_CLEAR;
            this.scene.start('RelicScene', { state: this.state });
        });
    }

    private applyGoldReward(): PvpGoldRewardBreakdown {
        const match = this.state.pvpMatch!;
        if (match.lastGoldReward && match.rewardedStages.includes(this.result.stage)) {
            return match.lastGoldReward;
        }

        const selfId = match.playerId;
        const opponentId = match.opponentId;
        const hasSingleWinner = this.result.winnerPlayerIds.length === 1;
        const lostStage = hasSingleWinner && !this.result.winnerPlayerIds.includes(selfId);
        const selfPoints = this.result.matchScore[selfId] || 0;
        const opponentPoints = this.result.matchScore[opponentId] || 0;
        const lagPoints = Math.max(0, opponentPoints - selfPoints);
        const reward: PvpGoldRewardBreakdown = {
            base: 16,
            loserCompensation: lostStage ? 8 : 0,
            lagCompensation: lagPoints * 8,
            lagPoints,
            total: 16 + (lostStage ? 8 : 0) + lagPoints * 8
        };

        this.state.gold += reward.total;
        match.lastGoldReward = reward;
        match.rewardedStages.push(this.result.stage);
        return reward;
    }

    private getTitle(): string {
        if (this.result.gameOver) {
            return this.result.matchWinnerId === this.state.pvpMatch?.playerId ? '对战胜利' : '对战失败';
        }
        if (this.result.winnerPlayerIds.length > 1) return '本关平局';
        return this.result.winnerPlayerIds.includes(this.state.pvpMatch!.playerId) ? '本关胜利' : '本关失利';
    }

    private renderPlayerResult(player: PvpStagePlayerResult): string {
        const isSelf = player.playerId === this.state.pvpMatch?.playerId;
        const isWinner = this.result.winnerPlayerIds.includes(player.playerId);
        return `
            <div class="pvp-player-result ${isSelf ? 'self' : ''} ${isWinner ? 'winner' : ''}">
                <div class="pvp-player-name">${player.playerName}${isSelf ? '（你）' : ''}</div>
                <div class="pvp-player-total">${player.totalScore.toLocaleString()}</div>
                <div class="pvp-round-pill-row">
                    ${player.roundScores.map((score, index) => `<span>R${index + 1} ${score.toLocaleString()}</span>`).join('')}
                </div>
            </div>
        `;
    }

    private getScoreText(): string {
        const match = this.state.pvpMatch!;
        const selfScore = this.result.matchScore[match.playerId] || 0;
        const opponentScore = this.result.matchScore[match.opponentId] || 0;
        return `${match.playerName} ${selfScore} : ${opponentScore} ${match.opponentName}`;
    }
}
