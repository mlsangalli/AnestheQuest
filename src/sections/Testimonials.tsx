"use client";

import { useState, useEffect, useCallback } from "react";
import TestimonialSlide from "@/components/TestimonialSlide";

const testimonials = [
  {
    quote:
      "O AnestheQuest foi fundamental na minha aprovação no TEA. As questões comentadas com explicações detalhadas fizeram toda a diferença na minha preparação. Recomendo para todos os residentes.",
    author: "Dra. Carolina Mendes",
    role: "Aprovada no TEA 2025 — SP",
  },
  {
    quote:
      "A plataforma me ajudou a identificar minhas fraquezas em farmacologia anestésica e focar nos pontos que realmente importavam. O sistema de revisão espaçada é excelente.",
    author: "Dr. Rafael Oliveira",
    role: "Residente R3 de Anestesiologia — RJ",
  },
  {
    quote:
      "Estudar com o AnestheQuest transformou minha forma de aprender. As simulações de casos clínicos são incrivelmente realistas e me prepararam muito bem para a prática.",
    author: "Dra. Juliana Ferreira",
    role: "Aprovada no TEA 2025 — MG",
  },
  {
    quote:
      "Como preceptor, indico o AnestheQuest para todos os meus residentes. O conteúdo é atualizado, baseado em evidências e alinhado com o que é cobrado nas provas.",
    author: "Dr. Marcos Andrade",
    role: "Preceptor de Anestesiologia — BA",
  },
  {
    quote:
      "A qualidade das questões e a profundidade das explicações não têm comparação. Foi o investimento mais importante que fiz na minha preparação para o título.",
    author: "Dra. Amanda Costa",
    role: "Aprovada no TEA 2024 — RS",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-[28px] md:text-[32px] font-light text-text-primary text-center mb-4">
          Quando o resultado realmente importa
        </h2>
        <p className="text-text-muted text-center mb-12 max-w-2xl mx-auto">
          Veja o que dizem os profissionais que confiaram no AnestheQuest para
          sua preparação
        </p>

        {/* Carousel */}
        <div className="relative overflow-hidden max-w-4xl mx-auto">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {testimonials.map((t, i) => (
              <TestimonialSlide key={i} {...t} />
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-[7.4px] mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-opacity duration-300 cursor-pointer ${
                i === current
                  ? "bg-[#252525] opacity-100"
                  : "bg-[#252525] opacity-30"
              }`}
              aria-label={`Ir para depoimento ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
