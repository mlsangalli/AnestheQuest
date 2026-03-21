import Button from "@/components/Button";

export default function Educators() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-6 max-w-[960px] text-center">
        <h2 className="text-[28px] md:text-[32px] font-light text-text-primary mb-6">
          Preceptores: Coloque seus residentes no caminho do sucesso
        </h2>
        <p className="text-text-muted text-base leading-relaxed mb-8 max-w-2xl mx-auto">
          O AnestheQuest oferece ferramentas institucionais para programas de
          residência em Anestesiologia. Acompanhe o desempenho dos seus
          residentes, identifique lacunas de conhecimento e personalize planos de
          estudo. Solicite uma demonstração gratuita para seu programa.
        </p>
        <Button variant="secondary" href="#contato">
          Fale Conosco
        </Button>
      </div>
    </section>
  );
}
