import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <Link 
          to="/" 
          className="flex items-center gap-3 text-[#FF385C] hover:text-[#E61E4D] transition-colors duration-200"
        >
          <img 
            src="/favicon-red.svg" 
            alt="Badminton Icon" 
            className="h-8 w-8"
          />
          <h1 className="text-4xl font-bold">Badminton Otaniemi</h1>
        </Link>
      </div>
    </header>
  );
} 