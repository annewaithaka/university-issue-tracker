import React from "react";

const IssueCard = ({ issue }) => {
  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <h3 className="text-lg font-semibold">{issue.title}</h3>
      <p className="text-gray-600">{issue.description}</p>
      <div className="flex justify-between text-sm mt-2 text-gray-500">
        <span>{issue.category}</span>
        <span>Status: {issue.status}</span>
      </div>
    </div>
  );
};

export default IssueCard;
