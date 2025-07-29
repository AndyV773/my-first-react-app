import React from "react";


export default function ToolBox({ id, title, description }) {
    return (
      <section className="tool-box" onClick={() => (window.location.href = `#${id}`)}>
        <h2>{title}</h2>
        <div className="tool-desc">{description}</div>
        <div className="tool-link">
          <span>Go to {title}</span>
        </div>
      </section>
    );
}
