"use client";
import { useState, useEffect } from "react";
import { auth, firestore } from "../../../lib/firebaseConfig"; // Assumindo que a configuração do Firebase já está pronta
import { collection, doc, setDoc, getDocs, query, getDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import MobileNavSidebar from "@/components/MB_NavSidebar"; // Menu Mobile
import SidebarHomepage from "@/components/SidebarHomepage"; // Menu Desktop

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(null); // Data selecionada no calendário
  const [note, setNote] = useState(""); // Texto da anotação
  const [notes, setNotes] = useState({}); // Anotações recuperadas do Firestore
  const [month, setMonth] = useState(new Date().getMonth()); // Mês atual
  const [year, setYear] = useState(new Date().getFullYear()); // Ano atual
  const [userPhotoURL, setUserPhotoURL] = useState("/images/default-avatar.png"); // Foto do usuário logado
  const [userData, setUserData] = useState({ name: '', level_perm: 'user' }); // Dados do usuário logado
  const [color, setColor] = useState("#81059e"); // Cor do ponto que vai aparecer no calendário
  const [editIndex, setEditIndex] = useState(null); // Índice da nota a ser editada

  // Função para buscar a foto e os dados do usuário logado
  const fetchUserData = async (uid) => {
    try {
      const loja1DocRef = doc(firestore, `loja1/users/${uid}/dados`);
      const loja1DocSnap = await getDoc(loja1DocRef);

      if (loja1DocSnap.exists()) {
        const data = loja1DocSnap.data();
        setUserPhotoURL(data.imageUrl || '/images/default-avatar.png');
        setUserData(data);
      } else {
        const loja2DocRef = doc(firestore, `loja2/users/${uid}/dados`);
        const loja2DocSnap = await getDoc(loja2DocRef);

        if (loja2DocSnap.exists()) {
          const data = loja2DocSnap.data();
          setUserPhotoURL(data.imageUrl || '/images/default-avatar.png');
          setUserData(data);
        } else {
          console.log('Nenhum documento encontrado para o UID:', uid);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserPhotoURL(user.photoURL || "/images/default-avatar.png");
        await fetchUserData(user.uid); // Buscar dados do usuário logado
      } else {
        console.log("Nenhum usuário logado");
      }
    });
    return () => unsubscribe();
  }, []);

  // Função para salvar a anotação no Firestore
  const saveNote = async () => {
    if (!selectedDate || !note) return;
    const noteRef = doc(firestore, "agenda", selectedDate);
    const noteData = {
      date: selectedDate,
      note: note,
      color: color, // Salvar a cor escolhida
    };

    // Se a nota já existir, adiciona a nova nota ao array
    const existingNotes = notes[selectedDate] || [];
    if (editIndex !== null) {
      // Se estamos editando, atualizamos a nota existente
      existingNotes[editIndex] = noteData;
    } else {
      // Caso contrário, adicionamos uma nova nota
      existingNotes.push(noteData);
    }

    await setDoc(noteRef, {
      notes: existingNotes, // Adiciona nova nota ao array
    });
    setNote(""); // Limpar o campo de input após salvar
    setColor("#81059e"); // Resetar a cor após salvar
    setEditIndex(null); // Resetar o índice de edição
    fetchNotes(); // Atualizar as anotações salvas
  };

  // Função para excluir uma anotação específica
  const deleteNote = async (noteIndex) => {
    if (!selectedDate) return;
    const noteRef = doc(firestore, "agenda", selectedDate);
    const existingNotes = notes[selectedDate] || [];

    // Remove a nota pelo índice
    const updatedNotes = existingNotes.filter((_, index) => index !== noteIndex);
    await setDoc(noteRef, {
      notes: updatedNotes,
    });
    fetchNotes(); // Atualizar as anotações salvas
  };

  // Função para buscar as anotações no Firestore
  const fetchNotes = async () => {
    const notesQuery = query(collection(firestore, "agenda"));
    const notesSnapshot = await getDocs(notesQuery);
    const notesData = {};
    notesSnapshot.forEach((doc) => {
      notesData[doc.id] = doc.data().notes || []; // Armazena as notas como um array
    });
    setNotes(notesData); // Atualiza o estado com as anotações
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Função para mudar de mês
  const changeMonth = (direction) => {
    let newMonth = month + direction;
    if (newMonth < 0) {
      setMonth(11);
      setYear(year - 1);
    } else if (newMonth > 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(newMonth);
    }
  };

  // Função para gerar os dias do mês atual
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Função para formatar a data no formato "dd-mm-yyyy"
  const formatDate = (day) => {
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = month + 1 < 10 ? `0${month + 1}` : month + 1;
    return `${formattedDay}-${formattedMonth}-${year}`;
  };

  // Função para editar uma nota existente
  const editNote = (noteData, index) => {
    setNote(noteData.note); // Carregar a nota no campo de entrada
    setColor(noteData.color); // Carregar a cor no seletor de cores
    setEditIndex(index); // Guardar o índice da nota que está sendo editada
  };

  return (
    <div className="flex flex-row min-h-screen bg-white">
      {/* Sidebar para telas maiores (desktop) */}
      <div>
        <SidebarHomepage
          userPhotoURL={userPhotoURL}
          userData={userData}
          currentPage="agenda"
        />
      </div>

      {/* MobileNavSidebar no topo para mobile */}
      <div className="block lg:hidden fixed top-0 left-0 w-full z-10">
        <MobileNavSidebar
          userPhotoURL={userPhotoURL}
          userData={userData}
          handleLogout={() => console.log("Logout function")} // Coloque aqui sua lógica de logout
        />
      </div>

      <div className="flex flex-1 flex-col p-8 mt-16 lg:mt-0">
        {/* Cabeçalho com navegação do mês */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="text-[#81059e]">&lt;</button>
          <h1 className="text-xl font-bold text-[#81059e]">
            {new Date(year, month).toLocaleString('pt-BR', { month: 'long' })} {year}
          </h1>
          <button onClick={() => changeMonth(1)} className="text-[#81059e]">&gt;</button>
        </div>

        {/* Calendário */}
        <div className="grid grid-cols-7 gap-2 text-center font-semibold">
          {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((day) => (
            <div key={day} className="text-[#81059e]">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {daysArray.map((day) => {
            const dateKey = formatDate(day);
            const dayNotes = notes[dateKey] || [];
            const maxDots = 6; // Defina o número máximo de bolinhas que cabem no quadrado
            const dotsToShow = dayNotes.slice(0, maxDots);

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateKey)}
                className={`border p-1 cursor-pointer relative ${selectedDate === dateKey ? "bg-[#81059e] text-white" : "text-[#81059e] bg-white border-[#81059e]"
                  }`}
                style={{ minHeight: '60px' }} // Ajuste conforme necessário
              >
                <div className="absolute top-1 left-1 text-sm">{day}</div>

                {/* Exibir pontos coloridos se houver notas no dia */}
                {dayNotes.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 flex flex-wrap items-center">
                    {dotsToShow.map((noteData, index) => (
                      <span
                        key={index}
                        className="w-4 h-4 rounded-full cursor-pointer mr-1 mb-1"
                        style={{ backgroundColor: noteData.color || "#81059e" }}
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que o clique na bolinha selecione a data
                          setSelectedDate(dateKey);
                          editNote(noteData, index);
                        }}
                      ></span>
                    ))}
                    {/* Exibir "+" se houver mais anotações */}
                    {dayNotes.length > maxDots && (
                      <span className="text-xs text-[#81059e]">+</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Campo para adicionar anotações */}
        {selectedDate && (
          <>
            <h2 className="mt-4 text-[#81059e] font-bold">Anotações para {selectedDate}</h2>
            <textarea
              className="border p-2 w-full mt-2 text-black"
              placeholder="Adicionar anotação"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex items-center mt-2">
              <label className="mr-2 text-[#81059e]">Cor do ponto:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-0 border-none"
              />
            </div>
            <div className="mt-2 flex space-x-4">
              <button onClick={saveNote} className="bg-[#81059e] text-white px-4 py-2">
                Salvar Anotação
              </button>
            </div>

            {/* Exibir anotações já salvas */}
            {notes[selectedDate] && (
              <div className="mt-4">
                <h3 className="text-[#81059e] font-semibold">Anotações salvas:</h3>
                {notes[selectedDate].map((noteData, index) => (
                  <div key={index} className="flex justify-between items-center  p-2 rounded-md mt-2">
                    <div>
                      <span className="font-semibold" style={{ color: noteData.color }}>{noteData.note}</span>
                    </div>
                    <button
                      onClick={() => deleteNote(index)} // Botão de lixeira
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
