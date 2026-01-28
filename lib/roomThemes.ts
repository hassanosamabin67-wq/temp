export type RoomType = 'soundscape' | 'art_exhibit' | 'collab_fitness' | 'think_tank' | 'wordflow' | 'open_collab';

export interface RoomTheme {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  gradientHover: string;
  fontFamily: string;
  modalBg: string;
  modalHeaderBg: string;
  borderColor: string;
  textColor: string;
  buttonBg: string;
  buttonHoverBg: string;
  countdownBg: string;
  countdownBorder: string;
  tagColor: string;
}

export const roomThemes: Record<RoomType, RoomTheme> = {
  soundscape: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    accent: '#C4B5FD',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    gradientHover: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
    fontFamily: "'Poppins', sans-serif",
    modalBg: 'rgb(0 0 0 / 72%)',
    modalHeaderBg: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    borderColor: '#8B5CF6',
    textColor: '#8B5CF6',
    buttonBg: '#8B5CF6',
    buttonHoverBg: '#7C3AED',
    countdownBg: 'rgba(139, 92, 246, 0.15)',
    countdownBorder: '#8B5CF6',
    tagColor: 'purple',
  },
  art_exhibit: {
    primary: '#F59E0B',
    secondary: '#FBBF24',
    accent: '#FCD34D',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    gradientHover: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    fontFamily: "'Playfair Display', serif",
    modalBg: 'rgb(0 0 0 / 72%)',
    modalHeaderBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    borderColor: '#F59E0B',
    textColor: '#D97706',
    buttonBg: '#F59E0B',
    buttonHoverBg: '#D97706',
    countdownBg: 'rgba(245, 158, 11, 0.15)',
    countdownBorder: '#F59E0B',
    tagColor: 'gold',
  },
  collab_fitness: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    gradientHover: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    fontFamily: "'Montserrat', sans-serif",
    modalBg: 'rgb(0 0 0 / 72%)',
    modalHeaderBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    borderColor: '#10B981',
    textColor: '#059669',
    buttonBg: '#10B981',
    buttonHoverBg: '#059669',
    countdownBg: 'rgba(16, 185, 129, 0.15)',
    countdownBorder: '#10B981',
    tagColor: 'green',
  },
  think_tank: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    accent: '#93C5FD',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    gradientHover: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    fontFamily: "'Inter', sans-serif",
    modalBg: 'rgb(0 0 0 / 72%)',
    modalHeaderBg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    borderColor: '#3B82F6',
    textColor: '#2563EB',
    buttonBg: '#3B82F6',
    buttonHoverBg: '#2563EB',
    countdownBg: 'rgba(59, 130, 246, 0.15)',
    countdownBorder: '#3B82F6',
    tagColor: 'blue',
  },
  wordflow: {
    primary: '#EC4899',
    secondary: '#F472B6',
    accent: '#F9A8D4',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    gradientHover: 'linear-gradient(135deg, #DB2777 0%, #BE185D 100%)',
    fontFamily: "'Lora', serif",
    modalBg: 'rgb(0 0 0 / 72%)',
    modalHeaderBg: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    borderColor: '#EC4899',
    textColor: '#DB2777',
    buttonBg: '#EC4899',
    buttonHoverBg: '#DB2777',
    countdownBg: 'rgba(236, 72, 153, 0.15)',
    countdownBorder: '#EC4899',
    tagColor: 'magenta',
  },
  open_collab: {
    primary: '#06B6D4',
    secondary: '#22D3EE',
    accent: '#67E8F9',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    gradientHover: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    fontFamily: "'Inter', sans-serif",
    modalBg: 'rgb(0 0 0 / 72%)',
    modalHeaderBg: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    borderColor: '#06B6D4',
    textColor: '#0891B2',
    buttonBg: '#06B6D4',
    buttonHoverBg: '#0891B2',
    countdownBg: 'rgba(6, 182, 212, 0.15)',
    countdownBorder: '#06B6D4',
    tagColor: 'cyan',
  },
};

export const getTheme = (roomType: string | undefined): RoomTheme => {
  if (!roomType || !(roomType in roomThemes)) {
    return roomThemes.think_tank;
  }
  return roomThemes[roomType as RoomType];
};

export const getRoomTypeLabel = (roomType: RoomType): string => {
  const labels: Record<RoomType, string> = {
    soundscape: 'Soundscape',
    art_exhibit: 'Art Exhibit',
    collab_fitness: 'Collab Fitness',
    think_tank: 'Think Tank',
    wordflow: 'Wordflow',
    open_collab: 'Open Collab',
  };
  return labels[roomType] || 'Collab Room';
};
