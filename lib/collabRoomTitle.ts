export const getRoomTitle = (type: string) => {
    switch (type) {
        case 'think_tank': return 'THINK TANK';
        case 'soundscape': return 'SOUND SCAPE';
        case 'art_exhibit': return 'ART EXHIBIT';
        case 'collab_fitness': return 'COLLAB FITNESS';
        case 'wordflow': return 'WORDFLOW';
        case 'open_collab': return 'OPEN COLLAB';
        default: return 'THINK TANK'
    }
}