import React from 'react';

const Stepper = ({ currentStep, totalSteps, steps, onStepClick }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              <button
                onClick={() => onStepClick && onStepClick(index + 1)}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  index + 1 === currentStep
                    ? 'bg-blue-500 text-white shadow-lg'
                    : index + 1 < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
                aria-label={`Étape ${index + 1}: ${step}`}
              >
                {index + 1}
              </button>
              <span className={`mt-2 text-sm font-medium ${
                index + 1 === currentStep ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {step}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div className={`flex-1 h-1 mx-4 rounded ${
                index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
