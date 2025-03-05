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
          <div className="p-3 border rounded-lg shadow-sm bg-white w-48">
            {/* Affichage de l'entrée et du résultat */}
            <div className="mb-3">
              <div className="text-right text-gray-700 text-lg p-1 border rounded bg-gray-100">
                {calculatorInput || '0'}
              </div>
              <div className="text-right text-gray-900 text-xl font-bold p-1">
                {calculatorResult || '0'}
              </div>
            </div>

            {/* Boutons de la calculatrice (disposition horizontale) */}
            <div className="grid grid-cols-4 gap-1">
              {['C', '←', '%', '/'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-1 text-sm font-medium rounded-md
                    ${button === 'C' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}
                    hover:bg-gray-200 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {['7', '8', '9', '×'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-1 text-sm font-medium rounded-md
                    ${button === '×' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}
                    hover:bg-gray-200 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {['4', '5', '6', '-'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-1 text-sm font-medium rounded-md
                    ${button === '-' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}
                    hover:bg-gray-200 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {['1', '2', '3', '+'].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-1 text-sm font-medium rounded-md
                    ${button === '+' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}
                    hover:bg-gray-200 transition-all
                  `}
                >
                  {button}
                </button>
              ))}

              {['0', '.', '='].map((button) => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={`
                    p-1 text-sm font-medium rounded-md
                    ${button === '=' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}
                    hover:bg-gray-200 transition-all
                    ${button === '0' ? 'col-span-2' : ''}
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