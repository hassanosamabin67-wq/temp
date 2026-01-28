import { AuthState } from "@/types/userInterface";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: AuthState = {
    email: "",
    firstName: "",
    lastName: "",
    userName: "",
    phoneNumber: null,
    isAuthenticated: false,
    profileId: "",
    createdAt: "",
    updatedAt: "",
    roles: [],
    profileType: "",
    subscription: "",
    title: "",
    overview: "",
    category: "",
    subcategory: "",
    experienceLevel: "",
    hourlyRate: 0,
    earning: 0,
    country: "",
    website: "",
    profileImage: "",
    profileCoverImage: "",
    video: "",
    companyName: "",
    receiveEmails: false,
    agreeTerms: false,
    isVerified: false,
    isSetupCompleted: false,
    workshops: [],
    mentorships: [],
    certifications: [],
    selfTaught: [],
    experience: [],
    skills: [],
    businessType: "individual"
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthData: (state, action: PayloadAction<AuthState>) => {
            const {
                email,
                firstName,
                userName,
                lastName,
                phoneNumber,
                isAuthenticated,
                profileId,
                createdAt,
                earning,
                updatedAt,
                roles,
                subscription,
                title,
                overview,
                category,
                subcategory,
                experienceLevel,
                hourlyRate,
                country,
                website,
                companyName,
                receiveEmails,
                video,
                agreeTerms,
                isVerified,
                profileType,
                profileImage,
                profileCoverImage,
                isSetupCompleted,
                workshops,
                mentorships,
                certifications,
                selfTaught,
                experience,
                skills,
                businessType
            } = action.payload;
            state.email = email;
            state.firstName = firstName;
            state.userName = userName,
                state.lastName = lastName;
            state.phoneNumber = phoneNumber;
            state.isAuthenticated = isAuthenticated;
            state.profileId = profileId;
            state.createdAt = createdAt;
            state.updatedAt = updatedAt;
            state.roles = roles;
            state.subscription = subscription;
            state.title = title;
            state.overview = overview;
            state.earning = earning;
            state.category = category;
            state.subcategory = subcategory;
            state.hourlyRate = hourlyRate;
            state.experienceLevel = experienceLevel;
            state.country = country;
            state.website = website;
            state.companyName = companyName;
            state.receiveEmails = receiveEmails;
            state.video = video;
            state.agreeTerms = agreeTerms;
            state.isVerified = isVerified;
            state.isSetupCompleted = isSetupCompleted;
            state.profileType = profileType;
            state.profileImage = profileImage;
            state.profileCoverImage = profileCoverImage;
            state.workshops = workshops;
            state.certifications = certifications;
            state.mentorships = mentorships;
            state.selfTaught = selfTaught;
            state.experience = experience;
            state.skills = skills;
            state.businessType = businessType;
        },
        clearAuthData: (state) => {
            state.email = "";
            state.firstName = "";
            state.userName = "";
            state.lastName = "";
            state.phoneNumber = null;
            state.isAuthenticated = false;
            state.profileId = "";
            state.createdAt = "";
            state.updatedAt = "";
            state.roles = [];
            state.subscription = "";
            state.title = "";
            state.overview = "";
            state.category = "";
            state.subcategory = "";
            state.experienceLevel = "";
            state.hourlyRate = 0;
            state.earning = 0;
            state.country = "";
            state.video = "";
            state.website = "";
            state.companyName = "";
            state.receiveEmails = false;
            state.agreeTerms = false;
            state.isVerified = false;
            state.isSetupCompleted = false;
            state.profileType = ""
            state.profileImage = ""
            state.profileCoverImage = ""
            state.workshops = [];
            state.certifications = [];
            state.mentorships = [];
            state.selfTaught = [];
            state.experience = [];
            state.skills = [];
            state.businessType = ''
        }, resetApp: () => initialState,
    },
});

export const {
    setAuthData,
    clearAuthData,
    resetApp,
} = authSlice.actions;

export default authSlice.reducer;