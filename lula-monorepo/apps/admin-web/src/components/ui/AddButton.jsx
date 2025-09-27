import React from "react";
import { useNavigate } from "react-router-dom";

const AddButton = ({ title = "Add", children }) => {
  const navigate = useNavigate();

  return (
    <button type="button" className="btn btn-primary py-1.5" onClick={() => navigate("add")}>
      {children || title}
    </button>
  );
};

export default AddButton;
