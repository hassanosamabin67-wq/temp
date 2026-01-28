import { useNotification } from '@/Components/custom/custom-notification';
import { supabase } from '@/config/supabase';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAuthData } from '@/store/slices/auth-slice';
import React, { use } from 'react'
import { useState } from 'react'




function Useprofileedit() {
    const {notify} = useNotification()
    const dispatch = useAppDispatch()
    const profile = useAppSelector((state) => state.auth);
    const [profileFirstName, setProfileFirstName] = useState(profile.firstName);
    const [profileLastName, setProfilelasteName] = useState(profile.lastName);
    const [profileUserName, setProfileUserName] = useState(profile.userName);
    const [editProfileName, setEditProfileName] = useState(false);
    const [editProfilImage, setEditImage] = useState(false);
    const [isEditModalOpen, setIsCompanyModalOpen] = useState(false);
    const [editCompanyName, setEditComapyName] = useState(profile.companyName);
    const [editoverview, setEditoverview] = useState(profile.overview);
    const [isEditCountrymodalOpen, setisCountryModalOpen] = useState(false)
    const [editCountry, setEditCountry] = useState(profile.country)
  const [uploadedImage, setUploadedImage] = useState<string | undefined>();
  const handleImageChange = (url: string) => {
setEditImage(false)  
};


    const editName = () => {
        setEditProfileName(true)
    }
    const handleOk = async() => {
        setEditProfileName(false);
        dispatch(setAuthData({...profile,firstName: profileFirstName, lastName: profileLastName, userName: profileUserName}))
        const { data, error } = await supabase
            .from('users')
            .update
            ({ 
                firstName: profileFirstName,
                lastName: profileLastName,
                userName: profileUserName
            })
            .eq('userId', profile.profileId)
            .select()
        if (error){
            notify({
                type: 'success',
                message: "null message"
            })
    }
    };
    const handleCancel = () => {
        setEditProfileName(false);
    };

    const handlecompanymodal = () => {
        setIsCompanyModalOpen(true);
    }
    const handleCompanyOk = async() => {
        setIsCompanyModalOpen(false)
        dispatch(setAuthData({...profile,companyName: editCompanyName}))
        const { data, error } = await supabase
            .from('users')
            .update
            ({ 
                companyName: editCompanyName,
                overview:editoverview
            })
            .eq('userId', profile.profileId)
            .select()
        if (error){
            notify({
                type: 'success',
                message: "null message"
            })
    }
    };
    const hanhandleCompanyCancel = () => {
        setIsCompanyModalOpen(false)   
    }

    const handleCountryModal = () => {
        setisCountryModalOpen(true)
    }
    const handleCountryOk = async() => {
        setisCountryModalOpen(false)
        dispatch(setAuthData({...profile,country: editCountry}))
        const { data, error } = await supabase
            .from('users')
            .update
            ({ 
                country: editCountry
            })
            .eq('userId', profile.profileId)
            .select()
        if (error){
            notify({
                type: 'success',
                message: "null message"
            })
    }
    };
    const handleCountryCancel = () => {
        setisCountryModalOpen(false)
    }


    return {
        editName,
        handleOk,
        handleCancel,
        editProfileName,
        setProfileFirstName,
        setProfilelasteName,
        setProfileUserName,
        handlecompanymodal,
        isEditModalOpen,
        handleCompanyOk,
        hanhandleCompanyCancel,
        setEditComapyName,
        setEditoverview,
        handleCountryModal,
        isEditCountrymodalOpen, 
        setEditCountry,
        handleCountryOk,
        uploadedImage,
        handleImageChange,
        setEditImage,
        editProfilImage,
        handleCountryCancel       
    }

    

  
}

export default Useprofileedit