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

    return (
        <div className="multi-step-form">
            {step === 1 && (
                <div>
                    <label className="block mb-2">What is the name of your project?</label>
                    <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} className="border p-2 w-full mb-4" />
                    <button onClick={handleNext} className="btn">Next</button>
                </div>
            )}
            {step === 2 && (
                <div>
                    <label className="block mb-2">Would you like a single page website or a website with multiple pages?</label>
                    <label className="block mb-2">
                        <input type="radio" name="appType" value="single" checked={formData.appType === 'single'} onChange={handleChange} className="mr-2" />
                        Single Page
                    </label>
                    <label className="block mb-2">
                        <input type="radio" name="appType" value="multiple" checked={formData.appType === 'multiple'} onChange={handleChange} className="mr-2" />
                        Multiple Pages
                    </label>
                    <button onClick={handlePrev} className="btn mr-2">Previous</button>
                    <button onClick={handleNext} className="btn">Next</button>
                </div>
            )}
            {step === 3 && (
                <div>
                    <label className="block mb-2">Do you have any colours that you&apos;d like the website to show?</label>
                    <input type="text" name="colors" value={formData.colors} onChange={handleChange} className="border p-2 w-full mb-4" />
                    <button onClick={handlePrev} className="btn mr-2">Previous</button>
                    <button onClick={handleNext} className="btn">Next</button>
                </div>
            )}
            {step === 4 && (
                <div>
                    <label className="block mb-2">Do you have a logo?</label>
                    <input type="file" name="logo" onChange={handleChange} className="border p-2 w-full mb-4" />
                    <button onClick={handlePrev} className="btn mr-2">Previous</button>
                    <button onClick={handleNext} className="btn">Next</button>
                </div>
            )}
            {step === 5 && (
                <div>
                    <label className="block mb-2">What is the purpose of the website?</label>
                    <textarea name="purpose" value={formData.purpose} onChange={handleChange} className="border p-2 w-full mb-4"></textarea>
                    <button onClick={handlePrev} className="btn mr-2">Previous</button>
                    <button onClick={handleComplete} className="btn">Complete</button>
                </div>
            )}
        </div>
    );
}
