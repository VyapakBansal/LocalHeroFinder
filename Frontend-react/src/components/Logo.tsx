interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo = ({ className = "", showText = false }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/hero-logo.svg" 
        alt="HERO Logo" 
        className="h-12 w-auto"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-orange-500">HERO</span>
          <span className="text-xs text-orange-500">Immediate Aid. Verified Responders</span>
        </div>
      )}
    </div>
  );
};

export default Logo;

