/**
 * Social Media Platform Presets
 * All dimensions in pixels
 */

export interface PlatformPreset {
    name: string;
    width: number;
    height: number;
    description: string;
}

export interface Platform {
    name: string;
    icon: string;
    color: string;
    presets: PlatformPreset[];
}

export const platforms: Platform[] = [
    {
        name: 'Instagram',
        icon: '📸',
        color: '#E4405F',
        presets: [
            { name: 'Square Post', width: 1080, height: 1080, description: 'Feed post' },
            { name: 'Portrait Post', width: 1080, height: 1350, description: '4:5 ratio' },
            { name: 'Story/Reel', width: 1080, height: 1920, description: '9:16 ratio' },
            { name: 'Landscape', width: 1080, height: 566, description: '1.91:1 ratio' }
        ]
    },
    {
        name: 'YouTube',
        icon: '▶️',
        color: '#FF0000',
        presets: [
            { name: 'Thumbnail', width: 1280, height: 720, description: 'Video thumbnail' },
            { name: 'Channel Banner', width: 2560, height: 1440, description: 'Profile banner' },
            { name: 'Shorts Thumbnail', width: 1080, height: 1920, description: 'Vertical video' }
        ]
    },
    {
        name: 'LinkedIn',
        icon: '💼',
        color: '#0A66C2',
        presets: [
            { name: 'Post Image', width: 1200, height: 627, description: 'Feed post' },
            { name: 'Cover Photo', width: 1128, height: 191, description: 'Profile cover' },
            { name: 'Profile Photo', width: 400, height: 400, description: 'Circular crop' },
            { name: 'Article Cover', width: 1200, height: 644, description: 'Article header' }
        ]
    },
    {
        name: 'Twitter/X',
        icon: '🐦',
        color: '#1DA1F2',
        presets: [
            { name: 'Post Image', width: 1200, height: 675, description: '16:9 ratio' },
            { name: 'Header Photo', width: 1500, height: 500, description: 'Profile header' },
            { name: 'Profile Photo', width: 400, height: 400, description: 'Circular crop' },
            { name: 'Card Image', width: 1200, height: 628, description: 'Link preview' }
        ]
    },
    {
        name: 'Facebook',
        icon: '👥',
        color: '#1877F2',
        presets: [
            { name: 'Post Image', width: 1200, height: 630, description: 'Feed post' },
            { name: 'Cover Photo', width: 820, height: 312, description: 'Profile cover' },
            { name: 'Profile Photo', width: 170, height: 170, description: 'Profile picture' },
            { name: 'Event Cover', width: 1920, height: 1005, description: 'Event header' },
            { name: 'Story', width: 1080, height: 1920, description: '9:16 ratio' }
        ]
    },
    {
        name: 'Pinterest',
        icon: '📌',
        color: '#E60023',
        presets: [
            { name: 'Standard Pin', width: 1000, height: 1500, description: '2:3 ratio' },
            { name: 'Square Pin', width: 1000, height: 1000, description: 'Square format' },
            { name: 'Long Pin', width: 1000, height: 2100, description: 'Infographic' }
        ]
    },
    {
        name: 'TikTok',
        icon: '🎵',
        color: '#000000',
        presets: [
            { name: 'Video/Post', width: 1080, height: 1920, description: '9:16 ratio' },
            { name: 'Profile Photo', width: 200, height: 200, description: 'Profile picture' }
        ]
    },
    {
        name: 'Twitch',
        icon: '🎮',
        color: '#9146FF',
        presets: [
            { name: 'Offline Banner', width: 1920, height: 1080, description: 'Stream offline' },
            { name: 'Profile Banner', width: 1200, height: 480, description: 'Channel header' },
            { name: 'Profile Photo', width: 256, height: 256, description: 'Avatar' }
        ]
    }
];

/**
 * Get all presets from all platforms as flat array
 */
export function getAllPresets(): (PlatformPreset & { platform: string; icon: string })[] {
    return platforms.flatMap(platform =>
        platform.presets.map(preset => ({
            ...preset,
            platform: platform.name,
            icon: platform.icon
        }))
    );
}

/**
 * Get popular presets for quick access
 */
export function getPopularPresets() {
    return [
        { platform: 'Instagram', preset: 'Square Post', width: 1080, height: 1080, icon: '📸' },
        { platform: 'Instagram', preset: 'Story/Reel', width: 1080, height: 1920, icon: '📸' },
        { platform: 'YouTube', preset: 'Thumbnail', width: 1280, height: 720, icon: '▶️' },
        { platform: 'LinkedIn', preset: 'Post Image', width: 1200, height: 627, icon: '💼' },
        { platform: 'Twitter/X', preset: 'Post Image', width: 1200, height: 675, icon: '🐦' },
        { platform: 'Facebook', preset: 'Post Image', width: 1200, height: 630, icon: '👥' }
    ];
}
