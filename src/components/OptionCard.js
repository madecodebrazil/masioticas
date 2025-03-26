import Image from 'next/image';

const OptionCard = ({ icon, label, onClick }) => {
    return (
        <div
            className="bg-gradient-to-b from-[#81059e] to-[#E437CA] p-6 mb-2 mx-2 text-white rounded-lg shadow-lg shadow-[#81059e]/50 flex items-center justify-center transition-all duration-300 hover:bg-[#CE8F00] hover:scale-105 hover:shadow-xl cursor-pointer max-w-[220px]"
            onClick={onClick} // Para possibilitar navegação ou ações ao clicar no card
        >
            {/* Ícone à esquerda */}
            <div className="flex items-center">
                <Image src={icon} width={35} height={35} alt={label} />
                {/* Texto à direita */}
                <span className="text-sm font-medium ml-4">{label}</span>
            </div>
        </div>
    );
};

export default OptionCard;
