interface CategoryCardProps {
  icon: string;
  title: string;
  description: string;
  href?: string;
}

export default function CategoryCard({
  icon,
  title,
  description,
  href = "#",
}: CategoryCardProps) {
  return (
    <div className="text-center px-4 py-6">
      <div className="mb-4">
        <i className={`${icon} text-[50px] text-primary-blue`}></i>
      </div>
      <h3 className="text-[20px] font-normal text-text-primary mb-3">{title}</h3>
      <p className="text-base text-text-muted mb-4 leading-relaxed">{description}</p>
      <a
        href={href}
        className="text-base font-light text-primary-blue hover:underline transition-colors"
      >
        Começar <i className="fa-solid fa-angle-right text-sm ml-1"></i>
      </a>
    </div>
  );
}
