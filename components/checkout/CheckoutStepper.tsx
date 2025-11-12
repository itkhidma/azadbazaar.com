'use client';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface CheckoutStepperProps {
  currentStep: number;
  steps: Step[];
}

export default function CheckoutStepper({ currentStep, steps }: CheckoutStepperProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Mobile Progress Bar */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-600">
              {steps[currentStep - 1]?.title}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Desktop Stepper */}
        <div className="hidden md:flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle and Info */}
                <div className="flex flex-col items-center relative">
                  {/* Circle */}
                  <div
                    className={`
                      w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300
                      ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-purple-600 text-white ring-4 ring-purple-200'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Title and Description */}
                  <div className="mt-2 text-center">
                    <div
                      className={`
                        text-xs md:text-sm font-semibold whitespace-nowrap
                        ${
                          isActive
                            ? 'text-purple-600'
                            : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }
                      `}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 hidden lg:block">
                      {step.description}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 px-2 md:px-4">
                    <div
                      className={`
                        h-1 rounded-full transition-all duration-300
                        ${
                          currentStep > step.number
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }
                      `}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
