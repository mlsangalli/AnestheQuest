interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
  className?: string;
  onClick?: () => void;
}

export default function Button({
  children,
  variant = "primary",
  href,
  className = "",
  onClick,
}: ButtonProps) {
  const baseStyles =
    "inline-block text-center cursor-pointer transition-all duration-150 ease-in-out font-normal";

  const variants = {
    primary:
      "bg-accent-gold text-text-primary rounded-[96px] px-8 py-3 text-[19.2px] shadow-[0_4px_9px_rgba(0,0,0,0.05)] hover:brightness-95",
    secondary:
      "bg-primary-blue text-white rounded-[80px] px-12 py-2 text-base border border-[#007BFF] hover:brightness-110",
  };

  const style = `${baseStyles} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={style}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={style}>
      {children}
    </button>
  );
}
