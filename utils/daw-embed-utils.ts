export interface DAWEmbed {
    id: string;
    platform: 'bandlab' | 'soundtrap' | 'soundation';
    embed_url: string;
    title: string;
    description?: string;
    added_by: string;
    created_at: string;
}

export interface DAWPlatform {
    name: string;
    domain: string;
    color: string;
    icon: string;
    description: string;
    embedInstructions: string;
}

export const DAW_PLATFORMS: Record<string, DAWPlatform> = {
    bandlab: {
        name: 'BandLab',
        domain: 'bandlab.com',
        color: '#1DB954',
        icon: '🎵',
        description: 'Free collaborative music creation platform',
        embedInstructions: 'Copy the share link from your BandLab project and paste it here.'
    },
    soundtrap: {
        name: 'Soundtrap',
        domain: 'soundtrap.com',
        color: '#1DB954',
        icon: '🎧',
        description: 'Spotify\'s online DAW with collaborative features',
        embedInstructions: 'Copy the share link from your Soundtrap project and paste it here.'
    },
    soundation: {
        name: 'Soundation',
        domain: 'soundation.com',
        color: '#FF6B35',
        icon: '🎹',
        description: 'Browser-based music studio with virtual instruments',
        embedInstructions: 'Copy the share link from your Soundation project and paste it here.'
    }
};

export const validateDAWUrl = (url: string, platform: string): boolean => {
    if (!url || !platform) return false;
    
    const urlLower = url.toLowerCase();
    const platformConfig = DAW_PLATFORMS[platform];
    
    if (!platformConfig) return false;
    
    return urlLower.includes(platformConfig.domain);
};

export const detectPlatformFromUrl = (url: string): string | null => {
    if (!url) return null;
    
    const urlLower = url.toLowerCase();
    
    for (const [platform, config] of Object.entries(DAW_PLATFORMS)) {
        if (urlLower.includes(config.domain)) {
            return platform;
        }
    }
    
    return null;
};

export const formatDAWUrl = (url: string, platform: string): string => {
    // Ensure URL has proper protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    return url;
};

export const getPlatformInfo = (platform: string): DAWPlatform | null => {
    return DAW_PLATFORMS[platform] || null;
};

export const getAllPlatforms = (): DAWPlatform[] => {
    return Object.values(DAW_PLATFORMS);
};

// Helper function to extract project ID from various DAW URLs
export const extractProjectId = (url: string, platform: string): string | null => {
    try {
        const urlObj = new URL(url);
        
        switch (platform) {
            case 'bandlab':
                // BandLab URLs typically look like: https://www.bandlab.com/project-name-123456
                const bandlabMatch = urlObj.pathname.match(/\/[^\/]+-(\d+)$/);
                return bandlabMatch ? bandlabMatch[1] : null;
                
            case 'soundtrap':
                // Soundtrap URLs typically look like: https://www.soundtrap.com/editor/project/123456
                const soundtrapMatch = urlObj.pathname.match(/\/project\/(\d+)/);
                return soundtrapMatch ? soundtrapMatch[1] : null;
                
            case 'soundation':
                // Soundation URLs typically look like: https://www.soundation.com/studio/project/123456
                const soundationMatch = urlObj.pathname.match(/\/project\/(\d+)/);
                return soundationMatch ? soundationMatch[1] : null;
                
            default:
                return null;
        }
    } catch (error) {
        console.error('Error extracting project ID:', error);
        return null;
    }
};

// Helper function to generate embed-friendly URLs
export const generateEmbedUrl = (url: string, platform: string): string => {
    const projectId = extractProjectId(url, platform);
    
    if (!projectId) return url;
    
    switch (platform) {
        case 'bandlab':
            return `https://www.bandlab.com/embed/project/${projectId}`;
        case 'soundtrap':
            return `https://www.soundtrap.com/embed/project/${projectId}`;
        case 'soundation':
            return `https://www.soundation.com/embed/project/${projectId}`;
        default:
            return url;
    }
}; 