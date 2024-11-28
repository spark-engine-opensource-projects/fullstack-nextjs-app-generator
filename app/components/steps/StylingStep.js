import React from 'react';

export default function StylingStep({ styling, onUpdate, onRegenerate }) {
    const handleColorChange = (colorName, value) => {
        const updatedColors = { ...styling.colors, [colorName]: value };
        onUpdate({ colors: updatedColors });
    };

    return (
        <div className="styling-step">
            <h2 className="text-2xl font-bold mb-4">Styling Plan</h2>

            {/* Regenerate Button */}
            <div className="mb-6">
                <button
                    onClick={onRegenerate}
                    className="btn bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                >
                    Regenerate Styling
                </button>
            </div>

            {/* Colors Section */}
            <div className="p-4 bg-gray-100 rounded">
                <h3 className="text-lg font-bold mb-4">Color Palette</h3>
                {Object.entries(styling.colors).map(([colorName, colorValue]) => (
                    <div key={colorName} className="mb-4 flex items-center">
                        <div className="flex items-center">
                            <span className="font-bold mr-2 capitalize">{colorName}:</span>
                            <div
                                className="w-10 h-10 rounded-full border-2 border-gray-300 mr-2"
                                style={{ backgroundColor: colorValue }}
                            ></div>
                        </div>
                        <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => handleColorChange(colorName, e.target.value)}
                            className="border-2 border-gray-300 rounded-lg mr-2"
                        />
                        <input
                            type="text"
                            value={colorValue}
                            onChange={(e) => handleColorChange(colorName, e.target.value)}
                            className="border p-2 rounded w-36"
                            placeholder="#FFFFFF"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
