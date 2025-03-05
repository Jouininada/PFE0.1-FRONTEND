import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';

interface ExpensePaymentControlSectionProps {
  className?: string;
  isDataAltered?: boolean;
  handleSubmit?: () => void;
  reset: () => void;
  loading?: boolean;
}

export const ExpensePaymentControlSection = ({
  className,
  isDataAltered,
  handleSubmit,
  reset,
  loading
}: ExpensePaymentControlSectionProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');

  // État pour la calculatrice
  const [calculatorInput, setCalculatorInput] = useState('');
  const [calculatorResult, setCalculatorResult] = useState('');

  // Fonction pour gérer les clics sur les boutons de la calculatrice
  const handleCalculatorButtonClick = (value: string) => {
    if (value === '=') {
      try {
        // Remplacer × par * avant d'évaluer
        const expression = calculatorInput.replace(/×/g, '*');
        setCalculatorResult(eval(expression).toString()); // Évaluer l'expression mathématique
      } catch (error) {
        setCalculatorResult('Error');
      }
    } else if (value === 'C') {
      // Réinitialiser l'entrée et le résultat
      setCalculatorInput('');
      setCalculatorResult('');
    } else if (value === '←') {
      // Supprimer le dernier caractère (vérifier que l'entrée n'est pas vide)
      if (calculatorInput.length > 0) {
        setCalculatorInput((prev) => prev.slice(0, -1));
      }
    } else {
      // Ajouter la valeur à l'entrée
      setCalculatorInput((prev) => prev + value);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col w-full gap-2">
        {/* Boutons "Save" et "Initialize" */}
        <Button className="flex items-center" onClick={handleSubmit}>
          <Save className="h-5 w-5" />
          <span className="mx-1">{tCommon('commands.save')}</span>
        </Button>
        <Button className="flex items-center" variant={'outline'} onClick={reset}>
          <Save className="h-5 w-5" />
          <span className="mx-1">{tCommon('commands.initialize')}</span>
        </Button>

        {/* Ajouter la calculatrice ici */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">{tCommon('calculator.title')}</h2>
          <div className="p-4 border rounded-lg shadow-md bg-white">
            {/* Affichage de l'entrée et du résultat */}
            <div className="mb-4">
              <div className="text-right text-gray-700 text-2xl p-2 border rounded bg-gray-100">
                {calculatorInput || '0'}
              </div>
              <div className="text-right text-gray-900 text-3xl font-bold p-2">
                {calculatorResult || '0'}
              </div>
            </div>

            {/* Boutons de la calculatrice (disposition horizontale) */}
            <div className="grid grid-cols-4 gap-2">
              {/* Ligne 1 : Mémoire */}
              {['MC', 'MR', 'M+', 'M-'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-4 text-xl font-bold rounded-lg
                    bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {/* Ligne 2 : Opérations spéciales */}
              {['%', 'CE', 'C', '←'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-4 text-xl font-bold rounded-lg
                    ${button === 'C' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}
                    hover:bg-gray-300 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {/* Ligne 3 : Opérations mathématiques */}
              {['1/x', 'x²', '√x', '+'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-4 text-xl font-bold rounded-lg
                    bg-blue-500 text-white hover:bg-blue-600 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {/* Ligne 4 : Chiffres et opérations */}
              {['7', '8', '9', '×'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-4 text-xl font-bold rounded-lg
                    ${button === '×' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
                    hover:bg-gray-300 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {/* Ligne 5 : Chiffres et opérations */}
              {['4', '5', '6', '-'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-4 text-xl font-bold rounded-lg
                    ${button === '-' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
                    hover:bg-gray-300 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {/* Ligne 6 : Chiffres et opérations */}
              {['1', '2', '3', '+'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-4 text-xl font-bold rounded-lg
                    ${button === '+' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
                    hover:bg-gray-300 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {/* Ligne 7 : Dernière ligne */}
              {['+/-', '0', '.', '='].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-4 text-xl font-bold rounded-lg
                    ${button === '=' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}
                    hover:bg-gray-300 transition-all
                  `}
                >
                  {button}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};