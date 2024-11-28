import React, { useState, useCallback, useMemo } from 'react';

const isValidHexColor = color => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

export default function StylingStep({ styling, onUpdate, onRegenerate }) {
    console.log(styling)
    const [errors, setErrors] = useState({});
    const [previewMode, setPreviewMode] = useState(false);

    const handleColorChange = useCallback((colorName, value) => {
        const isValid = isValidHexColor(value);
        setErrors(prev => ({ ...prev, [colorName]: isValid ? null : 'Invalid hex color' }));
        
        if (isValid) {
            const updatedColors = { ...styling.colors, [colorName]: value };
            onUpdate({ colors: updatedColors });
        }
    }, [styling.colors, onUpdate]);

    const previewStyles = useMemo(() => ({
        backgroundColor: styling.colors.primary,
        color: styling.colors.secondary,
        borderColor: styling.colors.accent
    }), [styling.colors]);

    return (
        <div className="styling-step">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Styling Plan</h2>
                <div className="space-x-4">
                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                    >
                        {previewMode ? 'Exit Preview' : 'Preview'}
                    </button>
                    <button
                        onClick={onRegenerate}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                    >
                        Regenerate Styling
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-100 rounded">
                    <h3 className="text-lg font-bold mb-4">Color Palette</h3>
                    {Object.entries(styling.colors).map(([colorName, colorValue]) => (
                        <div key={colorName} className="mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1 capitalize">
                                        {colorName}
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-10 h-10 rounded border-2 border-gray-300"
                                            style={{ backgroundColor: colorValue }}
                                        />
                                        <input
                                            type="color"
                                            value={colorValue}
                                            onChange={(e) => handleColorChange(colorName, e.target.value)}
                                            className="border-2 border-gray-300 rounded p-1"
                                        />
                                        <input
                                            type="text"
                                            value={colorValue}
                                            onChange={(e) => handleColorChange(colorName, e.target.value)}
                                            className={`border p-2 rounded w-32 ${
                                                errors[colorName] ? 'border-red-500' : ''
                                            }`}
                                        />
                                    </div>
                                    {errors[colorName] && (
                                        <p className="text-red-500 text-sm mt-1">{errors[colorName]}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {previewMode && (
                    <div className="p-4 rounded">
                        <h3 className="text-lg font-bold mb-4">Preview</h3>
                        <div 
                            className="p-6 rounded-lg shadow-lg border-2 transition-colors"
                            style={previewStyles}
                        >
                            <h4 className="text-xl font-bold mb-4">Sample Content</h4>
                            <p className="mb-4">
                                This is a preview of your selected color scheme. The background uses your primary color,
                                text uses your secondary color, and borders use your accent color.
                            </p>
                            <button
                                className="px-4 py-2 rounded border-2 transition-colors"
                                style={{
                                    backgroundColor: styling.colors.secondary,
                                    color: styling.colors.primary,
                                    borderColor: styling.colors.accent
                                }}
                            >
                                Sample Button
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}