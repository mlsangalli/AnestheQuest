import Button from "@/components/Button";

export default function Hero() {
  return (
    <section className="relative w-full h-[500px] md:h-[643px] overflow-hidden bg-gradient-to-r from-[#1a2332] via-[#2a3f55] to-[#3a5a7c]">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(30,136,229,0.15) 0%, transparent 40%),
                           radial-gradient(circle at 60% 80%, rgba(250,204,52,0.1) 0%, transparent 40%)`
        }} />
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 top-0 w-1/2 h-full hidden md:block">
        <svg viewBox="0 0 600 700" className="h-full w-full opacity-[0.07]" fill="none">
          <circle cx="400" cy="200" r="180" stroke="white" strokeWidth="1"/>
          <circle cx="350" cy="400" r="120" stroke="white" strokeWidth="0.5"/>
          <path d="M300 100 L500 300 L300 500 Z" stroke="white" strokeWidth="0.5" fill="none"/>
          {/* Stethoscope abstract shape */}
          <circle cx="420" cy="350" r="40" stroke="#FACC34" strokeWidth="1.5"/>
          <path d="M420 310 Q420 250 380 200" stroke="#FACC34" strokeWidth="1.5" fill="none"/>
          <path d="M420 310 Q420 250 460 200" stroke="#FACC34" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      {/* Hero text */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6 md:px-16 lg:px-28">
          <div className="max-w-xl animate-fade-in-up">
            <h1 className="text-[28px] md:text-[40px] font-medium leading-[1.2] text-white mb-4">
              Tornamos o conteúdo mais difícil de Anestesiologia fácil de entender
            </h1>
            <h3 className="text-[18px] md:text-[28px] font-light leading-[1.2] text-white/90 mb-8">
              Ferramentas de aprendizagem personalizáveis para provas e concursos de alto impacto
            </h3>
            <Button variant="primary" href="#categorias">
              Explore Nossos Produtos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
