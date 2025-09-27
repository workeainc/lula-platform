import React from "react";
import Tooltip from "./Tooltip";
import Icon from "./Icon";

const ActionButton = ({ title = "Title", icon, onClick, theme = "default" }) => {
  return (
    <Tooltip content={title} placement="top" theme={theme}>
      <button className="action-btn" onClick={onClick}>
        <Icon icon={icon} />
      </button>
    </Tooltip>
  );
};

export default ActionButton;
