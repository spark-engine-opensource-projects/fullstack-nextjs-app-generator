// components/MultiStepForm.js
import { useState } from 'react';

export default function MultiStepForm({ onComplete }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        projectName: '',
        appType: '',
        colors: '',
        logo: null,
        purpose: '',
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'logo') {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);
    
    const handleComplete = () => {
        onComplete(formData);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent the default form submission
            if (step < 5) {
                handleNext();
            } else {
                handleComplete();
            }
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-center text-gray-800">Step {step} of 5</h2>
                <p className="text-center text-gray-600">Please provide the following details</p>
            </div>
            {step === 1 && (
                <div>
                    <label className="block text-gray-700 mb-2 text-lg">What is the name of your project?</label>
                    <input 
                        type="text" 
                        name="projectName" 
                        value={formData.projectName} 
                        onChange={handleChange} 
                        onKeyPress={handleKeyPress} // Added to listen for "Enter" key
                        className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 mb-4"
                        placeholder="Enter your project name"
                    />
                    <div className="flex justify-end">
                        <button onClick={handleNext} className="btn-primary">Next</button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div>
                    <label className="block text-gray-700 mb-4 text-lg">Would you like a single page website or a website with multiple pages?</label>
                    <div className="flex items-center mb-4">
                        <input 
                            type="radio" 
                            name="appType" 
                            value="single" 
                            checked={formData.appType === 'single'} 
                            onChange={handleChange} 
                            className="mr-2"
                        />
                        <span className="text-gray-700">Single Page</span>
                    </div>
                    <div className="flex items-center mb-4">
                        <input 
                            type="radio" 
                            name="appType" 
                            value="multiple" 
                            checked={formData.appType === 'multiple'} 
                            onChange={handleChange} 
                            className="mr-2"
                        />
                        <span className="text-gray-700">Multiple Pages</span>
                    </div>
                    <div className="flex justify-between">
                        <button onClick={handlePrev} className="btn-secondary">Previous</button>
                        <button onClick={handleNext} className="btn-primary">Next</button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div>
                    <label className="block text-gray-700 mb-2 text-lg">Do you have any colors that you’d like the website to show?</label>
                    <input 
                        type="text" 
                        name="colors" 
                        value={formData.colors} 
                        onChange={handleChange} 
                        onKeyPress={handleKeyPress} // Added to listen for "Enter" key
                        className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 mb-4"
                        placeholder="Enter preferred colors"
                    />
                    <div className="flex justify-between">
                        <button onClick={handlePrev} className="btn-secondary">Previous</button>
                        <button onClick={handleNext} className="btn-primary">Next</button>
                    </div>
                </div>
            )}
            {step === 4 && (
                <div>
                    <label className="block text-gray-700 mb-2 text-lg">Do you have a logo?</label>
                    <div className="flex items-center justify-between mb-4">
            <label className="cursor-pointer shadow-md text-black py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200">
                Choose File (optional)
                <input 
                    type="file" 
                    name="logo" 
                    onChange={handleChange} 
                    className="hidden"
                />
            </label>
            <span className="ml-4 text-gray-500">
                {formData.logo ? formData.logo.name : 'No file chosen'}
            </span>
        </div>
                    <div className="flex justify-between">
                        <button onClick={handlePrev} className="btn-secondary">Previous</button>
                        <button onClick={handleNext} className="btn-primary">Next</button>
                    </div>
                </div>
            )}
            {step === 5 && (
                <div>
                    <label className="block text-gray-700 mb-2 text-lg">What is the purpose of the website?</label>
                    <textarea 
                        name="purpose" 
                        value={formData.purpose} 
                        onChange={handleChange} 
                        onKeyPress={handleKeyPress} // Added to listen for "Enter" key
                        className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 mb-4" 
                        rows="4"
                        placeholder="Describe the purpose of your website"
                    ></textarea>
                    <div className="flex justify-between">
                        <button onClick={handlePrev} className="btn-secondary">Previous</button>
                        <button onClick={handleComplete} className="btn-primary">Complete</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Utility classes for buttons
const btnBase = "py-2 px-4 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2";
const btnPrimary = `${btnBase} bg-blue-500 hover:bg-blue-600 focus:ring-blue-500`;
const btnSecondary = `${btnBase} bg-gray-500 hover:bg-gray-600 focus:ring-gray-500`;

// Using the utility classes in JSX
const btnPrimaryClass = "py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
const btnSecondaryClass = "py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2";
