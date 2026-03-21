export default function NewsBanner() {
  return (
    <div
      className="sticky bottom-0 z-40 w-full py-4 px-6"
      style={{ background: "rgba(0, 0, 0, 0.65)" }}
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 border-l-2 border-accent-gold pl-4">
        <span className="text-accent-gold text-xs font-semibold tracking-[0.15em] uppercase whitespace-nowrap">
          NOVIDADES
        </span>
        <p className="text-white text-xs md:text-[12.8px]">
          AnestheQuest lança novo banco de questões com mais de 3.000 perguntas comentadas para o TEA 2026.
        </p>
        <a
          href="#"
          className="text-accent-gold text-xs whitespace-nowrap hover:underline transition-colors"
        >
          Saiba Mais <i className="fa-solid fa-arrow-right text-[10px] ml-1"></i>
        </a>
      </div>
    </div>
  );
}
