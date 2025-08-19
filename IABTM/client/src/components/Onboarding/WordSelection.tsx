import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from 'react';

interface WordSelectionProps {
  initialWords?: string[];
  onSelectionChange: (selectedWords: string[]) => void;
  className?: string;
  addNewWords?: boolean;
  selectedWords?: string[]; 
}

const WordSelectionComponent: React.FC<WordSelectionProps> = ({
  initialWords = [],
  onSelectionChange,
  className = '',
  addNewWords = true,
  selectedWords: propSelectedWords = [],
}) => {
  const [words, setWords] = useState<string[]>(initialWords);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState<string>('');

  // Sync with incoming props 
  useEffect(() => {
    setSelectedWords(propSelectedWords);
  }, [propSelectedWords]);

  const toggleWordSelection = (word: string) => {
    let updatedSelection: string[];
    if (selectedWords.includes(word)) {
      updatedSelection = selectedWords.filter((item) => item !== word);
    } else {
      updatedSelection = [...selectedWords, word];
    }
    setSelectedWords(updatedSelection);
    onSelectionChange(updatedSelection);
  };

  const handleAddWord = () => {
    const trimmed = newWord.trim();
    if (trimmed !== '' && !words.includes(trimmed)) {
      const updatedWords = [...words, trimmed];
      setWords(updatedWords);
      setNewWord('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewWord(e.target.value);
  };

  return (
    <div className={`w-full mx-auto p-2 sm:p-4 ${className}`}>
      <div className="flex flex-wrap gap-2 mb-6">
        {words.map((word, index) => {
          const isSelected = selectedWords.includes(word);
          return (
            <div
              key={index}
              onClick={() => toggleWordSelection(word)}
              className={`py-2 px-3 rounded-full shadow-sm cursor-pointer transition-colors text-sm border
                ${isSelected
                  ? 'text-[#2E2E2E] font-semibold '
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
            >
              {word}
            </div>
          );
        })}
      </div>

      {addNewWords && (
        <div className="mt-6">
          <p className="text-gray-700 mb-2 text-sm font-semibold">Don't resonate with you?</p>
          <div className="flex flex-col sm:flex-row w-full">
            <input
              type="text"
              value={newWord}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type in here anything seems to right you"
              className="flex-grow p-2 border border-gray-300 rounded-lg sm:rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-black mb-2 sm:mb-0"
            />
            <button
              onClick={handleAddWord}
              className="text-blue-500 cursor-pointer px-4 rounded sm:rounded-l-none focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
            >
              +Add new
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordSelectionComponent;
