import React from "react";
import "./DescriptionCell.css";

export default function DescriptionCell({ text }) {
  const value = text || "—";

  return (
    <span className="description-cell" title={value}>
      {value}
    </span>
  );
}