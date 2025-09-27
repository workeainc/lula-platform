import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ title = "Back", children }) => {
  const navigate = useNavigate();

  return (
    <button type="button" className="btn btn-primary py-1.5" onClick={() => navigate(-1)}>
      {children || title}
    </button>
  );
};

export default BackButton;
