export interface RoleRewards {
    rank: number;
    role: {
        icon: string;
        id: string;
        name: string;
        unicode_emoji: string;
        color: number;
        permissions: number;
        position: number;
        hoist: boolean;
        managed: boolean;
        mentionable: boolean;
    }
}

export interface Players {
    avatar: string;
    discriminator: string;
    guild_id: string;
    id: string;
    username: string;
    message_count: number;
    monetize_xp_boost: number;
    xp: number;
    level: number;
    /**
     * From start to end: Current XP, EXP to next level, total EXP
     */
    detailed_xp: [number, number, number]
    is_monetize_subscriber: boolean;
}

export interface MeeseeksLeaderboard {
    page: number;
    guild: {
        id: string;
        icon: string;
        name: string;
        leaderboard_url: string;
        commands_prefix: string;
        premium: boolean;
        allow_join: boolean;
        invite_leaderboard: boolean;
        application_commands_enabled: boolean;
    };
    xp_rate: number;
    xp_per_message: [number, number];
    role_rewards: RoleRewards[];
    monetize_options: {
        display_plans: boolean;
        showcase_subscribers: boolean;
    };
    players: Players[];
    player: null | string;
    banner_url: null | string;
    is_member: boolean;
    admin: boolean;
    user_guild_settings: null;
    country: string;
}