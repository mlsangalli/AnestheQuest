import Button from "@/components/Button";

export default function Careers() {
  return (
    <section className="w-full">
      <div className="flex flex-wrap">
        {/* Image side */}
        <div className="w-full lg:w-[58%] min-h-[300px] lg:min-h-[433px] bg-gradient-to-br from-[#1a3a5c] to-[#2a5a8c] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg viewBox="0 0 400 400" className="w-3/4 h-3/4" fill="none">
              <circle cx="200" cy="200" r="150" stroke="white" strokeWidth="0.5"/>
              <circle cx="200" cy="200" r="100" stroke="white" strokeWidth="0.5"/>
              <path d="M200 50 L200 350" stroke="white" strokeWidth="0.3"/>
              <path d="M50 200 L350 200" stroke="white" strokeWidth="0.3"/>
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/20">
              <i className="fa-solid fa-user-doctor text-8xl mb-4"></i>
              <p className="text-lg font-light">Faça parte do nosso time</p>
            </div>
          </div>
        </div>

        {/* Content side */}
        <div
          className="w-full lg:w-[42%] flex items-center justify-center px-8 md:px-12 py-12 lg:py-0"
          style={{ background: "rgb(47, 64, 80)" }}
        >
          <div className="max-w-md">
            <h2 className="text-[24px] md:text-[28px] font-light text-white leading-snug mb-6">
              Você tem interesse em moldar o futuro do ensino em Anestesiologia?
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-8">
              Estamos sempre em busca de profissionais apaixonados por educação
              médica. Se você é anestesiologista e quer contribuir com a
              formação de novos especialistas, venha fazer parte do AnestheQuest.
            </p>
            <Button variant="secondary" href="#carreiras">
              Junte-se ao Time
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
