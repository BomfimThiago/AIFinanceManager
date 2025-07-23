import React from 'react';

const SummaryCard = ({ title, value, icon: Icon, bgColor, textColor }) => { // eslint-disable-line no-unused-vars
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;