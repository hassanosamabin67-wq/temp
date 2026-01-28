function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="auth-main">
            {children}
        </div>
    );
}

export default AuthLayout;
