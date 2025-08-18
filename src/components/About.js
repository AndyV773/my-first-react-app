import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { aboutInfo } from "../data/aboutInfo.js"; // import your tools array

export const About = ({ showMsg }) => {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const el = document.querySelector(hash);
            if (el) el.scrollIntoView({ behavior: "auto" });
        }
    }, [hash]);


    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleChange = (e) => {
        setContactForm({ ...contactForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: add your contact form submission logic here (email/send API/etc)
        showMsg("Message sent!", false);
        setContactForm({ name: "", email: "", message: "" });
    };

    // Separate out the "About" description from the rest
    const appDescription = aboutInfo.find((item) => item.id === "about-app");
    const otherTools = aboutInfo.filter((item) => item.id !== "about-app");


  return (
    <main className="about-page">
        <nav>
            <div className="flex g1">
                <Link to="/">Home</Link>
            </div>
        </nav>
            
        <p>{appDescription.description}</p>
        {appDescription.libs && (
            <ol className="about-list">
                {appDescription.libs.map((lib, idx) => (
                    <li key={idx}>{lib}</li>
                ))}
            </ol>
        )}


        
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
                    <p className="about-link">
                        <Link className="toolbox-link" to={originalPage}>{linkText}</Link>
                    </p>
                )}
            </section>
        ))}
        


        <section className="contact-form">
            <h2>Contact Us</h2>
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
                />
            </label>

            <button type="submit" className="decode">Send Message</button>
            </form>
        </section>
    </main>
  );
};

export default About;