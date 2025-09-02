import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { ThemeToggle, PreCopyOutputBlock } from "../utils/uiHelpers";

const IpAddy = ({ showMsg, theme, onToggleTheme }) => {
    const [ipData, setIpData] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const fetchIpDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            setIpData(data);
        } catch (err) {
            showMsg("Error: Failed to fetch IP info.", err);
            setIpData({ error: "Failed to fetch IP" });
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>IP Information</h2>
                <Link to="/about#about-ip-addy">Learn more</Link>          
            </div>

            <section>
                <div className="min-h200">
                    {loading && <p>Loading...</p>}
                    {ipData && !ipData.error && (
                        <div>
                            <p><strong>IP Address:</strong></p>
                            <PreCopyOutputBlock outputId={`ip-addy`} text={ipData.ip} />
                            <p><strong>City:</strong> {ipData.city}</p>
                            <p><strong>Region:</strong> {ipData.region}</p>
                            <p><strong>Country:</strong> {ipData.country}</p>
                            <p><strong>ISP:</strong> {ipData.org}</p>
                        </div>
                    )}
                    {ipData?.error && <p>{ipData.error}</p>}
                </div>
                <button onClick={fetchIpDetails} className="encode">Get My IP Info</button>
            </section>
        </main>
    );
};

export default IpAddy;
