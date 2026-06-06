import CategoryCard from "@/components/CategoryCard";

const categories = [
  {
    icon: "fa-solid fa-syringe",
    title: "Anestesiologia Geral",
    description:
      "Domine os fundamentos da anestesia geral, incluindo técnicas de intubação, manejo de vias aéreas e planos anestésicos.",
  },
  {
    icon: "fa-solid fa-pills",
    title: "Farmacologia",
    description:
      "Aprofunde-se nos agentes anestésicos, relaxantes musculares, opioides e adjuvantes farmacológicos.",
  },
  {
    icon: "fa-solid fa-heart-pulse",
    title: "Monitorização",
    description:
      "Entenda os princípios de monitorização hemodinâmica, respiratória e neurológica durante a anestesia.",
  },
  {
    icon: "fa-solid fa-hand-dots",
    title: "Bloqueios Regionais",
    description:
      "Estude técnicas de anestesia regional, bloqueios de nervos periféricos e anestesia neuroaxial.",
  },
  {
    icon: "fa-solid fa-baby",
    title: "Anestesia Pediátrica",
    description:
      "Prepare-se para os desafios únicos da anestesia em pacientes neonatos e pediátricos.",
  },
  {
    icon: "fa-solid fa-person-pregnant",
    title: "Anestesia Obstétrica",
    description:
      "Domine a analgesia de parto, anestesia para cesárea e complicações obstétricas.",
  },
  {
    icon: "fa-solid fa-brain",
    title: "Dor Crônica",
    description:
      "Explore o manejo multidisciplinar da dor crônica, técnicas intervencionistas e terapia farmacológica.",
  },
  {
    icon: "fa-solid fa-lungs",
    title: "Terapia Intensiva",
    description:
      "Estude ventilação mecânica, manejo hemodinâmico, sepse e cuidados intensivos perioperatórios.",
  },
];

export default function ProductCategories() {
  return (
    <section id="categorias" className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-[28px] md:text-[32px] font-light text-text-primary text-center mb-12">
          Escolha sua área de estudo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
          {categories.map((cat) => (
            <CategoryCard key={cat.title} {...cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
