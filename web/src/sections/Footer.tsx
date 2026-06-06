const productColumns = [
  {
    title: "Anestesiologia Geral",
    links: ["Questões TEA", "Simulados", "Flashcards", "Casos Clínicos"],
  },
  {
    title: "Farmacologia",
    links: ["Agentes Inalatórios", "Venosos", "Opioides", "Relaxantes Musculares"],
  },
  {
    title: "Monitorização",
    links: ["Hemodinâmica", "Respiratória", "Neurológica", "Temperatura"],
  },
  {
    title: "Bloqueios Regionais",
    links: ["Neuroaxial", "Nervos Periféricos", "Plexos", "Guiado por USG"],
  },
  {
    title: "Anestesia Pediátrica",
    links: ["Neonatal", "Lactentes", "Pré-escolar", "Escolar"],
  },
  {
    title: "Anestesia Obstétrica",
    links: ["Analgesia de Parto", "Cesárea", "Complicações", "Farmacologia"],
  },
  {
    title: "Dor Crônica",
    links: ["Farmacoterapia", "Intervencionismo", "Multidisciplinar", "Casos"],
  },
  {
    title: "Terapia Intensiva",
    links: ["Ventilação Mecânica", "Hemodinâmica", "Sepse", "Neurointensivismo"],
  },
];

const footerLinks = {
  Empresa: ["Sobre Nós", "Carreiras", "Imprensa", "Parcerias"],
  Recursos: ["Blog", "Guia de Estudos", "Calendário TEA", "FAQ"],
  Contato: ["Suporte", "contato@anesthquest.com.br", "WhatsApp"],
};

const socialIcons = [
  { icon: "fa-facebook-f", label: "Facebook" },
  { icon: "fa-instagram", label: "Instagram" },
  { icon: "fa-linkedin-in", label: "LinkedIn" },
  { icon: "fa-x-twitter", label: "X" },
  { icon: "fa-youtube", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-bg-dark text-white">
      {/* Product Directory */}
      <div className="container mx-auto px-6 pt-12 pb-8">
        <h3 className="text-lg font-bold text-white mb-2">
          Explore Todos os Produtos AnestheQuest
        </h3>
        <p className="text-gray-400 text-sm mb-8">Escolha sua área de estudo</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {productColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-bold text-sm mb-3">
                <a href="#" className="hover:text-primary-blue transition-colors">
                  {col.title}
                </a>
              </h4>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 text-sm hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-700 mx-6" />

      {/* Footer Links */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-bold text-sm mb-3">{title}</h4>
              <ul className="space-y-1.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 text-sm hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Siga-nos</h4>
            <div className="flex gap-4">
              {socialIcons.map((s) => (
                <a
                  key={s.icon}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                  aria-label={s.label}
                >
                  <i className={`fa-brands ${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="border-t border-gray-700 py-6 px-6">
        <div className="container mx-auto">
          <p className="text-gray-500 text-xs leading-relaxed mb-2">
            AnestheQuest não é afiliado a nenhuma sociedade de anestesiologia ou
            instituição de ensino mencionada neste site. Todos os nomes de exames
            e marcas registradas pertencem aos seus respectivos proprietários.
          </p>
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} AnestheQuest. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
