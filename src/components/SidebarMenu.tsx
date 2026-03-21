"use client";

const categories = [
  "ANESTESIOLOGIA GERAL",
  "FARMACOLOGIA",
  "MONITORIZAÇÃO",
  "BLOQUEIOS REGIONAIS",
  "ANESTESIA PEDIÁTRICA",
  "ANESTESIA OBSTÉTRICA",
  "DOR CRÔNICA",
  "TERAPIA INTENSIVA",
];

const utilityLinks = [
  "Carrinho",
  "Preços",
  "Blog",
  "Sobre Nós",
  "Contato",
];

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[320px] z-[60] transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "rgba(66, 66, 66, 0.95)" }}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-white/80 transition-colors cursor-pointer"
            aria-label="Fechar menu"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="px-6 pb-8">
          {/* Categories */}
          <ul className="space-y-1 mb-8">
            {categories.map((cat) => (
              <li key={cat}>
                <a
                  href="#"
                  className="block py-2.5 px-4 text-white font-medium text-[15px] tracking-wider rounded-full hover:bg-white/10 transition-colors"
                >
                  {cat}
                </a>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <hr className="border-white/20 mb-6" />

          {/* Utility links */}
          <ul className="space-y-1 mb-8">
            {utilityLinks.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="block py-2 px-4 text-white/80 text-sm hover:text-white transition-colors"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>

          {/* Social icons */}
          <div className="flex gap-4 px-4">
            {["facebook-f", "instagram", "linkedin-in", "x-twitter", "youtube"].map(
              (icon) => (
                <a
                  key={icon}
                  href="#"
                  className="text-white/60 hover:text-white transition-colors text-lg"
                >
                  <i className={`fa-brands fa-${icon}`}></i>
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
