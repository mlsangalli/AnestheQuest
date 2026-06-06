const awards = [
  {
    name: "SBA — Sociedade Brasileira de Anestesiologia",
    initials: "SBA",
  },
  {
    name: "Aprovado por Especialistas",
    initials: "AE",
  },
  {
    name: "Melhor Plataforma Educacional 2025",
    initials: "MPE",
  },
  {
    name: "Conteúdo Validado por Pares",
    initials: "CVP",
  },
];

export default function AwardsRecognition() {
  return (
    <section className="bg-bg-light-gray py-16 md:py-20">
      <div className="container mx-auto px-6 animate-fade-in">
        <h2 className="text-[28px] md:text-[32px] font-light text-text-primary text-center mb-12">
          Reconhecimentos & Parcerias
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {awards.map((award) => (
            <div
              key={award.name}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-md flex items-center justify-center">
                <span className="text-primary-blue font-bold text-xl md:text-2xl">
                  {award.initials}
                </span>
              </div>
              <p className="text-text-muted text-sm text-center max-w-[160px]">
                {award.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
