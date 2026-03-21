"use client";

import { useState } from "react";
import SidebarMenu from "./SidebarMenu";

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 md:px-10"
           style={{ background: "rgba(66, 66, 66, 0.9)" }}>
        <a href="#" className="text-white text-2xl font-semibold tracking-tight">
          Anesthe<span className="text-accent-gold">Quest</span>
        </a>
        <div className="flex items-center gap-5">
          <a href="#" className="text-white/80 hover:text-white transition-colors text-lg">
            <i className="fa-regular fa-circle-question"></i>
          </a>
          <a href="#" className="text-white/80 hover:text-white transition-colors text-lg">
            <i className="fa-regular fa-user"></i>
          </a>
          <a href="#" className="text-white/80 hover:text-white transition-colors text-lg">
            <i className="fa-solid fa-bag-shopping"></i>
          </a>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/80 hover:text-white transition-colors text-lg ml-1 cursor-pointer"
            aria-label="Abrir menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </nav>
      <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
