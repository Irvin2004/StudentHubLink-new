import { BrandLink } from "../../components/common/BrandLink.jsx";

export function AuthLayout({ children, description, features, title }) {
    return (
        <main className="auth-page">
            <section className="auth-left" aria-labelledby="auth-intro-title">
                <BrandLink className="auth-brand" />
                <h1 id="auth-intro-title">{title}</h1>
                <p>{description}</p>
                <div className="auth-features">
                    {features.map((feature) => (
                        <div key={feature}>{feature}</div>
                    ))}
                </div>
            </section>
            <section className="auth-right">{children}</section>
        </main>
    );
}
