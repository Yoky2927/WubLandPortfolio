import React from 'react';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

const ProgressCircle = ({ step, isActive, isCompleted, onClick }) => {
  const IconComponent = step.icon;

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer transition-all duration-500 group"
      onClick={() => onClick(step.number)}
      title={`${step.title}: ${step.description}`}
    >
      {step.number > 1 && (
        <div
          className={`absolute -left-16 top-6 w-16 h-0.5 transition-all duration-500 ${isCompleted || isActive
            ? "bg-amber-400"
            : "bg-gray-300 group-hover:bg-amber-300"
            }`}
        />
      )}

      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 group-hover:border-amber-400 ${isCompleted
          ? "bg-amber-400 border-amber-400 text-white shadow-lg"
          : isActive
            ? "border-amber-400 bg-amber-400 text-white shadow-lg"
            : "border-gray-300 bg-transparent text-gray-400 group-hover:text-amber-400"
          }`}
      >
        {isCompleted ? (
          <CheckCircle className="w-8 h-8" />
        ) : (
          <IconComponent className="w-8 h-8" />
        )}
      </div>

      <div
        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${isCompleted || isActive
          ? "bg-amber-600 text-white shadow-lg"
          : "bg-gray-300 text-gray-600 group-hover:bg-amber-500 group-hover:text-white"
          }`}
      >
        {step.number}
      </div>

      <div className="mt-4 text-center max-w-[140px]">
        <h3
          className={`text-sm font-semibold mb-1 transition-colors duration-300 ${isActive || isCompleted
            ? "text-amber-400"
            : "text-gray-600 group-hover:text-amber-400"
            }`}
        >
          {step.title}
        </h3>
        <p className="text-xs text-gray-500 group-hover:text-gray-600">
          {step.description}
        </p>
      </div>
    </div>
  );
};

const ProgressTracker = ({ 
  steps, 
  activeStep, 
  onStepClick, 
  onPrevious, 
  onContinue,
  theme = 'light'
}) => {
  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-16 relative">
          {steps.map((step) => (
            <ProgressCircle
              key={step.number}
              step={step}
              isActive={step.number === activeStep}
              isCompleted={step.completed}
              onClick={onStepClick}
            />
          ))}
        </div>
      </div>

      <div className={`p-8 rounded-xl border-2 ${theme === "dark"
        ? "bg-gray-800/50 border-amber-400/30"
        : "bg-white border-amber-200"
        } backdrop-blur-sm`}>

        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {steps.find(s => s.number === activeStep)?.title}
            </h3>
            <p className={`mt-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              {steps.find(s => s.number === activeStep)?.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {activeStep > 1 && (
              <button
                onClick={onPrevious}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${theme === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
            )}
            {activeStep < steps.length && (
              <button
                onClick={onContinue}
                className="bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;