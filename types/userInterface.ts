export interface certificationsInterface {
    name: string
    issuedBy: string;
    issuedDate: string;
    validTill: string;
}

export interface experienceInterface {
    name: string
    companyName: string;
    startDate: string;
    endDate: string;
    jobType: string;
    location: string;
}

export interface ProfileWithOwnership extends AuthState {
    isOwnProfile: boolean;
    isClient: boolean;
    is_online?: boolean;
    last_seen?: string | null;
}

export interface AuthState {
    email?: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    phoneNumber?: string | null;
    isAuthenticated?: boolean;
    isSetupCompleted?: boolean;
    profileId?: string;
    createdAt?: string;
    updatedAt?: string;
    roles?: string[];
    subscription?: string;
    gender?: string;
    dob?: Date;
    title: string;
    overview: string;
    category: string;
    subcategory: string;
    experienceLevel: string;
    hourlyRate: number;
    profileType?: string;
    country?: string;
    website?: string;
    companyName?: string | null;
    receiveEmails?: boolean;
    agreeTerms?: boolean;
    isVerified?: boolean;
    profileImage?: string;
    profileCoverImage?: string;
    video?: string;
    workshops?: experienceInterface[];
    mentorships?: experienceInterface[];
    certifications?: certificationsInterface[];
    selfTaught?: experienceInterface[];
    experience?: experienceInterface[];
    earning: number;
    skills?: string[];
    businessType: "company" | "individual" | string;
}