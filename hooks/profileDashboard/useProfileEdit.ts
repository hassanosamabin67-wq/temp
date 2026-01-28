import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form } from 'antd';
import { RootState, useAppSelector } from '@/store';
import { AuthState } from '@/types/userInterface';
import { setAuthData } from '@/store/slices/auth-slice';
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';

interface ProfileEditFormData {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    phoneNumber: string;
    location: string;
    profileTagline: string;
    bio: string;
    skills: string[];
    businessType: string;
    companyName?: string | null;
}

interface UseProfileEditReturn {
    form: any;
    loading: boolean;
    error: string | null;
    initialValues: ProfileEditFormData;
    handleSubmit: (values: ProfileEditFormData) => Promise<void>;
    handleSkillAdd: (skill: string) => void;
    handleSkillRemove: (skill: string) => void;
}

export const useProfileEdit = (): UseProfileEditReturn => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { notify } = useNotification()

    const dispatch = useDispatch();
    const authState = useAppSelector((state) => state.auth);
    // const authState = useSelector((state: RootState) => state.auth);

    const initialValues: ProfileEditFormData = {
        firstName: authState.firstName || '',
        lastName: authState.lastName || '',
        email: authState.email || '',
        userName: authState.userName || '',
        phoneNumber: authState.phoneNumber || '',
        location: authState.country || '',
        profileTagline: authState.title || '',
        bio: authState.overview || '',
        skills: authState.skills || [],
        businessType: authState.businessType,
        companyName: authState.companyName
    };

    const handleSubmit = useCallback(async (values: ProfileEditFormData) => {
        setLoading(true);
        setError(null);

        try {
            const updatedAuthState: AuthState = {
                ...authState,
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                userName: values.userName,
                phoneNumber: values.phoneNumber,
                country: values.location,
                title: values.profileTagline,
                overview: values.bio,
                skills: values.skills,
                businessType: values.businessType,
                companyName: values.companyName || null
            };

            const { error } = await supabase
                .from("users")
                .update(updatedAuthState)
                .eq("userId", authState.profileId);

            if (error) {
                console.error("ERROR UPDATING PROFILE ", error)
                return
            }

            dispatch(setAuthData(updatedAuthState));
            console.log(updatedAuthState, 'Profile updated successfully');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            console.error('Profile update failed:', err);
        } finally {
            setLoading(false);
        }
    }, [authState, dispatch]);

    const handleSkillAdd = useCallback((skill: string) => {
        const currentSkills = form.getFieldValue('skills') || [];
        if (skill.trim() && !currentSkills.includes(skill.trim())) {
            const updatedSkills = [...currentSkills, skill.trim()];
            form.setFieldValue('skills', updatedSkills);
        } else {
            notify({ type: "error", message: "Duplicate Skills should not be added" })
        }
    }, [form]);

    const handleSkillRemove = useCallback((skill: string) => {
        const currentSkills = form.getFieldValue('skills') || [];
        const updatedSkills = currentSkills.filter((s: string) => s !== skill);
        form.setFieldValue('skills', updatedSkills);
    }, [form]);

    return {
        form,
        loading,
        error,
        initialValues,
        handleSubmit,
        handleSkillAdd,
        handleSkillRemove
    };
};