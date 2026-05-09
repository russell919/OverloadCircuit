export interface PlayerProfile {
    displayName: string;
    playerCode: string;
}

const PROFILE_KEY = 'overload_circuit_player_profile';

export function generatePlayerCode(): string {
    return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

export function getPlayerProfile(): PlayerProfile | null {
    try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return null;
        const profile = JSON.parse(raw) as PlayerProfile;
        if (isValidProfile(profile)) return profile;
    } catch {
    }
    return null;
}

export function savePlayerProfile(profile: PlayerProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
        displayName: profile.displayName.slice(0, 8),
        playerCode: profile.playerCode
    }));
}

export function getPlayerLabel(): string {
    const profile = getPlayerProfile();
    return profile ? `${profile.displayName}#${profile.playerCode}` : '未登记';
}

export function isValidProfile(profile: PlayerProfile): boolean {
    return !!profile.displayName && profile.displayName.length <= 8 && /^\d{4}$/.test(profile.playerCode);
}

export async function submitPveLeaderboard(highestRoundScore: number, highestStage: number): Promise<void> {
    const profile = getPlayerProfile();
    if (!profile) return;
    await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...profile,
            highestRoundScore,
            highestStage
        })
    });
}
