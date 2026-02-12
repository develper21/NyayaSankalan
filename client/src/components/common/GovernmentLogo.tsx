import React from 'react';

export const GovernmentLogo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Circle - Government Seal */}
      <circle cx="50" cy="50" r="48" fill="#1B4F72" stroke="#FFFFFF" strokeWidth="2"/>
      
      {/* Inner Circle */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="1"/>
      
      {/* Pillar/Column - Symbol of Justice */}
      <g transform="translate(50, 50)">
        {/* Three Pillars representing Three Pillars of Justice System */}
        
        {/* Left Pillar */}
        <rect x="-20" y="-15" width="6" height="25" fill="#FFFFFF"/>
        <rect x="-21" y="-17" width="8" height="3" fill="#FFFFFF"/>
        <rect x="-21" y="10" width="8" height="3" fill="#FFFFFF"/>
        
        {/* Center Pillar (Taller) */}
        <rect x="-3" y="-20" width="6" height="30" fill="#FFFFFF"/>
        <rect x="-4" y="-22" width="8" height="3" fill="#FFFFFF"/>
        <rect x="-4" y="10" width="8" height="3" fill="#FFFFFF"/>
        
        {/* Right Pillar */}
        <rect x="14" y="-15" width="6" height="25" fill="#FFFFFF"/>
        <rect x="13" y="-17" width="8" height="3" fill="#FFFFFF"/>
        <rect x="13" y="10" width="8" height="3" fill="#FFFFFF"/>
        
        {/* Base Platform */}
        <rect x="-25" y="13" width="50" height="4" fill="#FFFFFF"/>
        
        {/* Scales of Justice on Top */}
        <g transform="translate(0, -25)">
          {/* Center pole */}
          <rect x="-1" y="0" width="2" height="8" fill="#FFFFFF"/>
          {/* Horizontal beam */}
          <rect x="-12" y="1" width="24" height="1.5" fill="#FFFFFF"/>
          {/* Left scale pan */}
          <line x1="-10" y1="2" x2="-10" y2="5" stroke="#FFFFFF" strokeWidth="0.5"/>
          <ellipse cx="-10" cy="6" rx="4" ry="1.5" fill="none" stroke="#FFFFFF" strokeWidth="0.5"/>
          {/* Right scale pan */}
          <line x1="10" y1="2" x2="10" y2="5" stroke="#FFFFFF" strokeWidth="0.5"/>
          <ellipse cx="10" cy="6" rx="4" ry="1.5" fill="none" stroke="#FFFFFF" strokeWidth="0.5"/>
        </g>
      </g>
      
      {/* Bottom Text Arc - "NYAYA" */}
      <path id="textPathTop" d="M 15,50 A 35,35 0 0,1 85,50" fill="none"/>
      <text fontSize="9" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial, sans-serif">
        <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
          न्याय संकलन
        </textPath>
      </text>
    </svg>
  );
};

export const GovernmentEmblem: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <GovernmentLogo className="w-12 h-12" />
      <div className="flex flex-col">
        <div className="text-lg font-bold text-[#1B4F72]" style={{ fontFamily: 'Georgia, serif' }}>
          NyayaSankalan
        </div>
        <div className="text-xs text-gray-600 uppercase tracking-wide">
          Police-Court Case Management System
        </div>
      </div>
    </div>
  );
};
