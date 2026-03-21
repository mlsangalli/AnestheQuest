interface TestimonialSlideProps {
  quote: string;
  author: string;
  role: string;
}

export default function TestimonialSlide({
  quote,
  author,
  role,
}: TestimonialSlideProps) {
  return (
    <div className="w-full flex-shrink-0 px-4 md:px-8">
      <div className="max-w-2xl mx-auto md:mx-0">
        {/* Quote icon */}
        <div className="mb-6">
          <i className="fa-solid fa-quote-left text-4xl text-primary-blue"></i>
        </div>

        {/* Quote text */}
        <p className="text-base font-light text-text-muted leading-relaxed mb-6">
          {quote}
        </p>

        {/* Decorative bar */}
        <div className="mb-4">
          <i className="fa-solid fa-minus text-primary-blue text-4xl"></i>
        </div>

        {/* Author */}
        <p className="text-text-primary font-medium text-base">{author}</p>
        <p className="text-text-muted text-sm">{role}</p>
      </div>
    </div>
  );
}
