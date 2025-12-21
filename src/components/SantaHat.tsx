const SantaHat = ({ className = "" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main hat body */}
      <defs>
        <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="hatShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Hat tip with swing animation */}
      <g className="origin-[45px_35px] animate-[swing_2s_ease-in-out_infinite]">
        {/* The curving tip of the hat */}
        <path
          d="M45 35 Q60 15 85 25 Q100 35 95 50 Q85 45 75 42 Q60 38 50 40 Z"
          fill="url(#hatGradient)"
          filter="url(#softShadow)"
        />
        {/* Pompom at the end */}
        <circle
          cx="95"
          cy="45"
          r="10"
          fill="#f5f5f4"
          filter="url(#softShadow)"
        />
        <circle
          cx="93"
          cy="43"
          r="3"
          fill="#e7e5e4"
          opacity="0.6"
        />
      </g>
      
      {/* Main hat base */}
      <path
        d="M10 55 Q25 30 50 35 Q45 40 45 45 L10 55 Z"
        fill="url(#hatShadow)"
        filter="url(#softShadow)"
      />
      <path
        d="M10 55 Q30 35 55 40 Q50 50 40 55 L10 55 Z"
        fill="url(#hatGradient)"
        filter="url(#softShadow)"
      />
      
      {/* White fur trim */}
      <ellipse
        cx="30"
        cy="60"
        rx="30"
        ry="10"
        fill="#fafaf9"
        filter="url(#softShadow)"
      />
      {/* Fur texture highlights */}
      <ellipse
        cx="20"
        cy="58"
        rx="8"
        ry="4"
        fill="#f5f5f4"
        opacity="0.7"
      />
      <ellipse
        cx="38"
        cy="59"
        rx="6"
        ry="3"
        fill="#f5f5f4"
        opacity="0.7"
      />
      <ellipse
        cx="15"
        cy="62"
        rx="5"
        ry="3"
        fill="#e7e5e4"
        opacity="0.5"
      />
    </svg>
  );
};

export default SantaHat;
