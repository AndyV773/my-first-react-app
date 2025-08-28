import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { aboutInfo } from "../data/aboutInfo.js"; // import your tools array
import emailjs from "emailjs-com";
emailjs.init("OV7TuaOdwTQ7yrWjx");


export const About = ({ showMsg }) => {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const el = document.querySelector(hash);
            if (el) el.scrollIntoView({ behavior: "auto" });
        }
    }, [hash]);

    const scrollToTop = (e) => {
        e.preventDefault(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleChange = (e) => {
        setContactForm({ ...contactForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic HTML5 form validation
        const form = e.target;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Disable button while sending
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            await emailjs.send(
                "service_a5ubnxa", // service ID
                "template_xb2zlxg", // template ID
                {
                    from_web: "React Encryption App",
                    from_name: contactForm.name,
                    from_email: contactForm.email,
                    from_message: contactForm.message,
                }
            );
            showMsg("Your message has been sent!", false);
            setContactForm({ name: "", email: "", message: "" });
        } catch (err) {
            console.error(err);
            showMsg("Oops! Something went wrong. Please try again.", true);
        } finally {
            submitButton.disabled = false;
        }
    };

    // Separate out the "About" description from the rest
    const appDescription = aboutInfo.find((item) => item.id === "about-app");
    const otherTools = aboutInfo.filter((item) => item.id !== "about-app");

    return (
        <main className="about-page">
            <nav className="flex space-between">
                <Link to="/">Home</Link>
                <Link to="/about#get-in-touch"
                    onClick={(e) => {
                        const el = document.querySelector("#get-in-touch");
                        if (el) {
                            e.preventDefault(); // prevent router from re-navigating to same URL
                            el.scrollIntoView({ behavior: "smooth" });
                        }
                    }}
                >Get In Touch</Link>
            </nav>
                
            <p>{appDescription.description}</p>
            {appDescription.libs && (
                <ol className="about-list">
                    {appDescription.libs.map((lib, idx) => (
                        <li key={idx}>{lib}</li>
                    ))}
                </ol>
            )}

            <p className="about-link">
                {appDescription.additional
                    .split('\n\n') // split into paragraphs
                    .map((para, pIndex) => (
                    <React.Fragment key={pIndex}>
                        {para.split(/\[link\]|\[\/link\]/).map((part, i, arr) => (
                        <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && <Link to="/obfuscation-tools">Obfuscation Tools</Link>}
                        </React.Fragment>
                        ))}
                        {pIndex < appDescription.additional.split('\n\n').length - 1 && <><br /><br /></>}
                    </React.Fragment>
                ))}
            </p>

            <h2>Features and Tools</h2>
            {otherTools.map(({ id, title, description, steps, additional, originalPage, linkText }) => (
                <section key={id} id={id} className="about-box">
                    <h2>{title}</h2>
                    <p>{description}</p>

                    {steps && (
                        <ol className="about-list">
                            {steps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                            ))}
                        </ol>
                    )}

                    <p>{additional}</p>

                    {originalPage && (
                        <p className="about-link flex space-between">
                            <a href="#top" onClick={scrollToTop}>Top &#11014;</a>
                            <Link className="toolbox-link" to={originalPage}>{linkText}</Link>
                        </p>
                    )}
                </section>
            ))}
            
            <section id="get-in-touch" className="contact-form">
                <h2>Get In Touch</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name
                        <input
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Message
                        <textarea
                            name="message"
                            rows={5}
                            value={contactForm.message}
                            onChange={handleChange}
                            required
                            minLength="20"
                            maxLength="500"
                        />
                    </label>

                    <button type="submit" className="decode">Send Message</button>
                </form>
            </section>
        </main>
    );
};

export default About;