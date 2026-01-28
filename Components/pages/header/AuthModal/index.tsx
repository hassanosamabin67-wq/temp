'use client'
import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, Building2, Globe, ChevronLeft, ChevronRight, Check, Briefcase, Palette } from 'lucide-react';
import './styles.css';
import { supabase } from '@/config/supabase';
import { useRouter } from 'next/navigation';
import { logUserAction } from '@/utils/PlatformLogging';
import { sendWelcomeEmail } from '@/utils/emailServices/emailServices';
import Select from 'react-select';
import { useNotification } from '@/Components/custom/custom-notification';
import { BASE_URL, BASE_URL_CLIENT } from '@/utils/constants/navigations';
import { useAppDispatch } from '@/store';
import { setAuthData } from '@/store/slices/auth-slice';
import { setCookie } from 'cookies-next';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';
type ProfileType = 'client' | 'Visionary' | null;
type BusinessType = 'individual' | 'company';

interface Country {
    label: string;
    value: string;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>('login');
    const [signupStep, setSignupStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup fields
    const [profileType, setProfileType] = useState<ProfileType>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [businessType, setBusinessType] = useState<BusinessType>('individual');
    const [companyName, setCompanyName] = useState('');
    const [receiveEmails, setReceiveEmails] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const { notify } = useNotification();
    const dispatch = useAppDispatch()

    // Fetch countries on mount
    useEffect(() => {
        fetch("https://valid.layercode.workers.dev/list/countries?format=select&flags=true&value=code")
            .then((response) => response.json())
            .then((data) => {
                setCountries(data.countries);
                setSelectedCountry(data?.userSelectValue);
            })
            .catch(() => { });
    }, []);

    if (!isOpen) return null;

    const validateStep2 = () => {
        if (!firstName.trim()) return 'Please enter your first name';
        if (!lastName.trim()) return 'Please enter your last name';
        if (!userName.trim()) return 'Please enter your username';
        if (!email.trim()) return 'Please enter your email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email';
        if (!password) return 'Please enter a password';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
            return 'Password must contain at least one uppercase letter, one number, and one special character';
        }
        if (password !== confirmPassword) return 'Passwords do not match';
        return null;
    };

    const validateStep3 = () => {
        if (!selectedCountry) return 'Please select your country';
        if (businessType === 'company' && !companyName.trim()) return 'Please enter your company name';
        if (!agreeTerms) return 'You must agree to the terms of service';
        return null;
    };

    const handleNextStep = () => {
        setError('');
        if (signupStep === 1 && !profileType) {
            setError('Please select an account type');
            return;
        }
        if (signupStep === 2) {
            const validationError = validateStep2();
            if (validationError) {
                setError(validationError);
                return;
            }
        }
        setSignupStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        setError('');
        setSignupStep(prev => prev - 1);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            setLoading(true);
            if (!loginEmail || !loginPassword) {
                notify({ type: "error", message: "Email and Password are required" });
                setLoading(false);
                return;
            }
            // Step 1: Sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) {
                console.error("Login Error:", error);
                notify({ type: "error", message: error.message || "Sign-in Failed", });
                setLoading(false);
                return;
            }

            const user = data?.user;
            if (!user) {
                notify({ type: "error", message: "User authentication failed", });
                return;
            }

            // Step 2: Fetch User Data from Database
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', loginEmail)
                .limit(1)
                .single();

            if (userError || !userData) {
                console.error("User Data Error:", userError);
                notify({ type: "error", message: "User not found in database", });
                return;
            }

            // Step 3: Store User Data in Cookie and Redux
            const userObject = userData;
            userObject.profileId = userData.userId
            console.log("Login Data Submitted:", userObject);

            setCookie("userData", JSON.stringify(userObject)); // Store user data in cookie
            dispatch(setAuthData(userObject)); // Dispatch to Redux store

            // Step 4: Navigate to Profile if Not Setup Completed
            if (!userObject.isSetupCompleted) {
                console.log("User not setup, navigating to profile:", userObject.userId);
                logUserAction.onLogin(userData.userId)
                notify({ type: "info", message: "Logged in successfully, navigating to profile setup...." });
                const profileUrl = `/profile/${userObject.userId}`;
                router.push(profileUrl);
            } else if (!userObject?.stripe_account_id) {
                console.log("No Stripe account found, starting onboarding...");
                notify({ type: "info", message: "No Stripe account found, starting onboarding..." });
                const res = await fetch("/api/stripe/onboard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: userObject.userId }),
                });

                const { url } = await res.json();
                if (url) {
                    window.location.href = url;
                    return;
                } else {
                    console.warn("Stripe onboarding URL not returned. Proceeding to profile.");
                }
            } else if (userData.profileType.toLowerCase() == "visionary") {
                console.log("User setup completed, redirecting to profile");
                logUserAction.onLogin(userData.userId);
                setSuccess('Logged in successfully!');
                onClose();
                resetForm();
                notify({ type: "success", message: "Logged in successfully, redirecting to dashboard...." });
                router.push(`/${BASE_URL}`); // Navigate to a default dashboard if setup is complete
            } else {
                console.log("User setup completed, redirecting to dashboard");
                logUserAction.onLogin(userData.userId)
                notify({ type: "success", message: "Logged in successfully, redirecting to dashboard...." });
                router.push(`/${BASE_URL_CLIENT}`); // Navigate to a default dashboard if setup is complete
            }

        } catch (err) {
            console.error("Unexpected Error:", err);
            notify({
                type: "error",
                message: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setSuccess('Password reset email sent! Check your inbox.');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (values: any) => {
        setError('');
        const validationError = validateStep3();
        if (validationError) {
            setError(validationError);
            return;
        }
        setLoading(true);
        values.country = selectedCountry ? selectedCountry?.label?.slice(5) : "";

        try {
            // Step 1: Create auth user
            const { data, error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
            });

            if (error) {
                console.log(error);
                notify({ type: "error", message: error.message || "Signup Failed" });
                setLoading(false);
                return;
            }

            const user = data.user;

            if (user) {
                // Step 2: Insert into users table
                const { error: insertError } = await supabase.from("users").insert([
                    {
                        userId: user.id,
                        firstName: values.firstName,
                        lastName: values.lastName,
                        userName: values.userName,
                        email: values.email,
                        country: values.country,
                        website: values.website,
                        isVerified: false,
                        businessType: values.businessType,
                        companyName: values.companyName,
                        receiveEmails: values.receiveEmails,
                        agreeTerms: values.agreeTerms,
                        profileType: profileType,
                        status: profileType === "client" ? 'Approved' : 'Pending'
                    },
                ]);

                if (insertError) {
                    console.error("Error inserting user profile:", insertError);
                    notify({ type: "error", message: "Profile creation failed" });
                    setLoading(false);
                    return;
                }

                // Step 3: Log user action
                logUserAction.onSignup(user.id);

                // Step 4: Send welcome email
                try {
                    await sendWelcomeEmail({
                        receiverEmail: values.email,
                        firstName: values.firstName,
                        profileType: profileType === "client" ? "client" : "visionary"
                    });

                } catch (emailError) {
                    console.error("Error sending welcome email:", emailError);
                    setSuccess('Account created successfully! Please check your email to verify your account.');
                    notify({ type: "success", message: "Account created successfully! You can now log in." });
                    router.push("/login");
                }
            }
            onClose();
            resetForm();
        } catch (error) {
            console.error("Signup error:", error);
            notify({ type: "error", message: "An unexpected error occurred during signup" });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setLoginEmail('');
        setLoginPassword('');
        setProfileType(null);
        setFirstName('');
        setLastName('');
        setUserName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setBusinessType('individual');
        setCompanyName('');
        setReceiveEmails(false);
        setAgreeTerms(false);
        setError('');
        setSuccess('');
        setMode('login');
        setSignupStep(1);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const switchToSignup = () => {
        setError('');
        setSuccess('');
        setMode('signup');
        setSignupStep(1);
    };

    const switchToLogin = () => {
        setError('');
        setSuccess('');
        setMode('login');
        setSignupStep(1);
    };

    const getOverlayContent = () => {
        if (mode === 'login') {
            return { title: 'Welcome Back', subtitle: 'Sign in to continue your creative journey' };
        }
        if (mode === 'forgot') {
            return { title: 'Reset Password', subtitle: "We'll help you get back on track" };
        }
        if (signupStep === 1) {
            return { title: 'Join Kaboom Collab', subtitle: 'Choose how you want to be part of our community' };
        }
        if (signupStep === 2) {
            return { title: 'Create Your Profile', subtitle: 'Tell us about yourself' };
        }
        return { title: 'Almost There!', subtitle: 'Just a few more details' };
    };

    const overlayContent = getOverlayContent();

    return (
        <div className="auth-modal-overlay" onClick={handleClose}>
            <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="auth-modal-close" onClick={handleClose}>
                    <X size={24} />
                </button>

                <div className="auth-modal-content">
                    <div className="auth-modal-image">
                        <img
                            src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800"
                            alt="Collaboration"
                        />
                        <div className="auth-modal-image-overlay">
                            <h3>{overlayContent.title}</h3>
                            <p>{overlayContent.subtitle}</p>
                        </div>
                    </div>

                    <div className="auth-modal-form-section">
                        {/* Login Mode */}
                        {mode === 'login' && (
                            <>
                                <div className="auth-modal-header">
                                    <h2 className="auth-modal-title">Welcome Back</h2>
                                    <p className="auth-modal-subtitle">Sign in to continue your journey</p>
                                </div>

                                {error && (
                                    <div className="auth-alert auth-alert-error">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="auth-alert auth-alert-success">
                                        <Check size={18} />
                                        <span>{success}</span>
                                    </div>
                                )}

                                <form onSubmit={handleLogin} className="auth-form">
                                    <div className="auth-form-group">
                                        <label className="auth-label">Email Address</label>
                                        <div className="auth-input-wrapper">
                                            <Mail className="auth-input-icon" size={20} />
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                                className="auth-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="auth-form-group">
                                        <label className="auth-label">Password</label>
                                        <div className="auth-input-wrapper">
                                            <Lock className="auth-input-icon" size={20} />
                                            <input
                                                type="password"
                                                placeholder="Enter your password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                                className="auth-input"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setMode('forgot')}
                                        className="auth-forgot-link"
                                    >
                                        Forgot password?
                                    </button>

                                    <button type="submit" disabled={loading} className="auth-submit-btn">
                                        {loading ? <div className="auth-spinner" /> : 'Sign In'}
                                    </button>
                                </form>

                                <div className="auth-divider">
                                    <p className="auth-switch">
                                        Don't have an account?{' '}
                                        <button onClick={switchToSignup} className="auth-switch-link">
                                            Sign up
                                        </button>
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Forgot Password Mode */}
                        {mode === 'forgot' && (
                            <>
                                <div className="auth-modal-header">
                                    <h2 className="auth-modal-title">Reset Password</h2>
                                    <p className="auth-modal-subtitle">We'll send you a reset link</p>
                                </div>

                                {error && (
                                    <div className="auth-alert auth-alert-error">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="auth-alert auth-alert-success">
                                        <Check size={18} />
                                        <span>{success}</span>
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} className="auth-form">
                                    <div className="auth-form-group">
                                        <label className="auth-label">Email Address</label>
                                        <div className="auth-input-wrapper">
                                            <Mail className="auth-input-icon" size={20} />
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                                className="auth-input"
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading} className="auth-submit-btn">
                                        {loading ? <div className="auth-spinner" /> : 'Send Reset Link'}
                                    </button>
                                </form>

                                <div className="auth-divider">
                                    <p className="auth-switch">
                                        Remember your password?{' '}
                                        <button onClick={switchToLogin} className="auth-switch-link">
                                            Sign in
                                        </button>
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Signup Mode - Multi-step */}
                        {mode === 'signup' && (
                            <>
                                {/* Progress Steps */}
                                <div className="signup-progress">
                                    <div className={`progress-step ${signupStep >= 1 ? 'active' : ''} ${signupStep > 1 ? 'completed' : ''}`}>
                                        <div className="step-circle">
                                            {signupStep > 1 ? <Check size={14} /> : '1'}
                                        </div>
                                        <span className="step-label">Account Type</span>
                                    </div>
                                    <div className="progress-line" />
                                    <div className={`progress-step ${signupStep >= 2 ? 'active' : ''} ${signupStep > 2 ? 'completed' : ''}`}>
                                        <div className="step-circle">
                                            {signupStep > 2 ? <Check size={14} /> : '2'}
                                        </div>
                                        <span className="step-label">Basic Info</span>
                                    </div>
                                    <div className="progress-line" />
                                    <div className={`progress-step ${signupStep >= 3 ? 'active' : ''}`}>
                                        <div className="step-circle">3</div>
                                        <span className="step-label">Details</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="auth-alert auth-alert-error">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="auth-alert auth-alert-success">
                                        <Check size={18} />
                                        <span>{success}</span>
                                    </div>
                                )}

                                {/* Step 1: Account Type Selection */}
                                {signupStep === 1 && (
                                    <div className="signup-step-content">
                                        <div className="auth-modal-header">
                                            <h2 className="auth-modal-title">Join as a</h2>
                                            <p className="auth-modal-subtitle">Select your account type to get started</p>
                                        </div>

                                        <div className="account-type-cards">
                                            <div
                                                className={`account-type-card ${profileType === 'client' ? 'selected' : ''}`}
                                                onClick={() => setProfileType('client')}
                                            >
                                                <div className="card-radio">
                                                    <div className="radio-outer">
                                                        {profileType === 'client' && <div className="radio-inner" />}
                                                    </div>
                                                </div>
                                                <div className="card-icon client-icon">
                                                    <Briefcase size={28} />
                                                </div>
                                                <h3>Client</h3>
                                                <p>I'm looking to hire talent for my projects</p>
                                            </div>

                                            <div
                                                className={`account-type-card ${profileType === 'Visionary' ? 'selected' : ''}`}
                                                onClick={() => setProfileType('Visionary')}
                                            >
                                                <div className="card-radio">
                                                    <div className="radio-outer">
                                                        {profileType === 'Visionary' && <div className="radio-inner" />}
                                                    </div>
                                                </div>
                                                <div className="card-icon visionary-icon">
                                                    <Palette size={28} />
                                                </div>
                                                <h3>Visionary</h3>
                                                <p>I'm a creative professional seeking opportunities</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleNextStep}
                                            disabled={!profileType}
                                            className="auth-submit-btn"
                                        >
                                            Continue as {profileType === 'client' ? 'Client' : profileType === 'Visionary' ? 'Visionary' : '...'}
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}

                                {/* Step 2: Basic Info */}
                                {signupStep === 2 && (
                                    <div className="signup-step-content">
                                        <div className="auth-modal-header compact">
                                            <h2 className="auth-modal-title">Create Your Account</h2>
                                        </div>

                                        <div className="auth-form">
                                            <div className="auth-form-row">
                                                <div className="auth-form-group">
                                                    <label className="auth-label">First Name</label>
                                                    <div className="auth-input-wrapper">
                                                        <User className="auth-input-icon" size={18} />
                                                        <input
                                                            type="text"
                                                            placeholder="First name"
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            className="auth-input"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="auth-form-group">
                                                    <label className="auth-label">Last Name</label>
                                                    <div className="auth-input-wrapper">
                                                        <User className="auth-input-icon" size={18} />
                                                        <input
                                                            type="text"
                                                            placeholder="Last name"
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            className="auth-input"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="auth-form-group">
                                                <label className="auth-label">Username</label>
                                                <div className="auth-input-wrapper">
                                                    <span className="auth-input-icon" style={{ fontSize: '16px', fontWeight: 600 }}>@</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Choose a username"
                                                        value={userName}
                                                        onChange={(e) => setUserName(e.target.value)}
                                                        className="auth-input"
                                                    />
                                                </div>
                                            </div>

                                            <div className="auth-form-group">
                                                <label className="auth-label">{profileType === 'Visionary' ? 'Email' : 'Work Email'}</label>
                                                <div className="auth-input-wrapper">
                                                    <Mail className="auth-input-icon" size={18} />
                                                    <input
                                                        type="email"
                                                        placeholder="Enter your email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="auth-input"
                                                    />
                                                </div>
                                            </div>

                                            <div className="auth-form-row">
                                                <div className="auth-form-group">
                                                    <label className="auth-label">Password</label>
                                                    <div className="auth-input-wrapper">
                                                        <Lock className="auth-input-icon" size={18} />
                                                        <input
                                                            type="password"
                                                            placeholder="Create password"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="auth-input"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="auth-form-group">
                                                    <label className="auth-label">Confirm</label>
                                                    <div className="auth-input-wrapper">
                                                        <Lock className="auth-input-icon" size={18} />
                                                        <input
                                                            type="password"
                                                            placeholder="Confirm password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="auth-input"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="password-hint">
                                                Min 8 characters with uppercase, number & special character
                                            </p>
                                        </div>

                                        <div className="signup-nav-buttons">
                                            <button onClick={handlePrevStep} className="auth-back-btn">
                                                <ChevronLeft size={20} />
                                                Back
                                            </button>
                                            <button onClick={handleNextStep} className="auth-submit-btn">
                                                Continue
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Additional Details */}
                                {signupStep === 3 && (
                                    <div className="signup-step-content">
                                        <div className="auth-modal-header compact">
                                            <h2 className="auth-modal-title">Final Details</h2>
                                        </div>

                                        <div className="auth-form">
                                            <div className="auth-form-group">
                                                <label className="auth-label">Country</label>
                                                <Select
                                                    options={countries}
                                                    value={selectedCountry}
                                                    onChange={(option) => setSelectedCountry(option as Country)}
                                                    placeholder="Select your country"
                                                    className="country-select"
                                                    classNamePrefix="country-select"
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            borderRadius: '0.75rem',
                                                            border: '2px solid #e5e7eb',
                                                            padding: '0.25rem',
                                                            '&:hover': { borderColor: '#3b82f6' },
                                                        }),
                                                        option: (base, state) => ({
                                                            ...base,
                                                            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                                                        }),
                                                    }}
                                                />
                                            </div>

                                            <div className="auth-form-group">
                                                <label className="auth-label">Business Type</label>
                                                <div className="business-type-toggle">
                                                    <button
                                                        type="button"
                                                        className={`toggle-btn ${businessType === 'individual' ? 'active' : ''}`}
                                                        onClick={() => setBusinessType('individual')}
                                                    >
                                                        <User size={16} />
                                                        Individual
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`toggle-btn ${businessType === 'company' ? 'active' : ''}`}
                                                        onClick={() => setBusinessType('company')}
                                                    >
                                                        <Building2 size={16} />
                                                        Company
                                                    </button>
                                                </div>
                                            </div>

                                            {businessType === 'company' && (
                                                <div className="auth-form-group">
                                                    <label className="auth-label">Company Name</label>
                                                    <div className="auth-input-wrapper">
                                                        <Building2 className="auth-input-icon" size={18} />
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Acme Inc."
                                                            value={companyName}
                                                            onChange={(e) => setCompanyName(e.target.value)}
                                                            className="auth-input"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="auth-checkbox-group">
                                                <label className="auth-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={receiveEmails}
                                                        onChange={(e) => setReceiveEmails(e.target.checked)}
                                                    />
                                                    <span className="checkmark"></span>
                                                    <span className="checkbox-text">Send me helpful emails about jobs and opportunities</span>
                                                </label>

                                                <label className="auth-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={agreeTerms}
                                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                                    />
                                                    <span className="checkmark"></span>
                                                    <span className="checkbox-text">
                                                        I agree to the{' '}
                                                        <a href="/terms" target="_blank">Terms of Service</a>,{' '}
                                                        <a href="/user-agreement" target="_blank">User Agreement</a> and{' '}
                                                        <a href="/privacy-policy" target="_blank">Privacy Policy</a>
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="signup-nav-buttons">
                                            <button onClick={handlePrevStep} className="auth-back-btn">
                                                <ChevronLeft size={20} />
                                                Back
                                            </button>
                                            <button
                                                onClick={handleSignupSubmit}
                                                disabled={loading}
                                                className="auth-submit-btn"
                                            >
                                                {loading ? <div className="auth-spinner" /> : 'Create Account'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="auth-divider">
                                    <p className="auth-switch">
                                        Already have an account?{' '}
                                        <button onClick={switchToLogin} className="auth-switch-link">
                                            Sign in
                                        </button>
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}