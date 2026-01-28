export interface Artwork {
  id: string;
  title: string;
  imageUrl: string;
  medium?: string;
  price?: number;
  description?: string;
  commentaryUrl?: string;
  commentaryType?: string;
  is_sold?: boolean;
  host: string;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'visionary' | 'client' | 'visitor';
}

export interface ArtExhibitRoom {
  id: string;
  title: string;
  description: string;
  accessType: 'public' | 'ticketed';
  artworks: Artwork[];
  visionary: User;
  participants: User[];
}

export interface artWorkCard {
  img: string;
  title: string;
  description: string;
  price: number;
  isSold?: boolean;
  onClick?: () => void;
}

export interface AddArtWorkModalProps {
  open: boolean;
  onCancel: () => void;
  setArtWork: (artWork: Artwork) => void;
  hostId: string;
}