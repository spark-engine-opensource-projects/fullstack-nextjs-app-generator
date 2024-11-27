import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { generateNormalReactPage } from './api';

const generateFolderStructureJson = async (projectData, projectComponents, jsconfig, serverlessApis) => {
    if (!projectData || !projectComponents || !jsconfig || !serverlessApis) return null;

    const structure = {
        name: 'project-root',
        children: []
    };

    // Helper function to safely add children
    const addChildren = (parentArray, childrenData, childTransform) => {
        if (Array.isArray(childrenData)) {
            parentArray.push(...childrenData.map(childTransform));
        }
    };

    // Function to generate layout configuration for a page
    const generateLayoutConfig = (pageComponents) => {
        return pageComponents.map(component => ({
            id: component.name,
            position: component.position || { x: 0, y: 0 },
            dimensions: component.dimensions || { width: 0, height: 0 }
        }));
    };

    // Function to modify component code with layout information
    function modifyComponentCode(code, position, dimensions) {
        const reactImport = `import React from 'react';\n`;
        const styledImport = `import styled from 'styled-components';\n`;

        // Create a wrapper with positioning
        const wrapperComponent = `
const PositionedWrapper = styled.div\`
    position: absolute;
    left: ${position?.x || 0}px;
    top: ${position?.y || 0}px;
    width: ${dimensions?.width || 'auto'};
    height: ${dimensions?.height || 'auto'};
\`;\n`;

        // Modify the component to use the wrapper
        let modifiedCode = `${reactImport}${styledImport}${wrapperComponent}${code}`;

        // Wrap the component's return statement with PositionedWrapper
        modifiedCode = modifiedCode.replace(
            /return\s*\(([\s\S]*?)\);/,
            'return (<PositionedWrapper>$1</PositionedWrapper>);'
        );

        // Add export default if it doesn't exist
        if (!modifiedCode.includes('export default')) {
            modifiedCode = modifiedCode.replace(/function\s+(\w+)/, 'export default function $1');
        }

        return modifiedCode;
    }

    // Pages
    if (projectData.pages) {
        structure.children.push({
            name: 'pages',
            children: []
        });

        // Generate layout configuration file
        structure.children.push({
            name: 'layout.config.js',
            content: `export default ${JSON.stringify({ 
                pages: projectData.pages.reduce((acc, page) => ({
                    ...acc,
                    [page.name]: generateLayoutConfig(page.components)
                }), {})
            }, null, 2)}`
        });

        // Generate the content for each page
        for (const page of projectData.pages) {
            const strippedName = (page.name || 'unnamed_page').replace(/\s+/g, '');
            let pageContent = '';

            try {
                // Include layout information in the page generation prompt
                const layoutInfo = generateLayoutConfig(page.components);
                const prompt = `Generate a Next.js page for ${page.name} with the following layout: ${JSON.stringify(layoutInfo)}. 
                Include these components: ${page.components.map(c => c.name).join(', ')}. 
                Reference jsconfig.json: ${JSON.stringify(jsconfig)}.`;
                
                pageContent = await generateNormalReactPage(prompt);
                pageContent = pageContent.replace(/```[\s\S]*?```/g, match => match.replace(/```/g, '').trim());

                // Add layout imports and configuration
                pageContent = `import layoutConfig from '../layout.config.js';\n${pageContent}`;
            } catch (error) {
                console.error(`Error generating page content for ${page.name}:`, error);
                pageContent = `// Error generating page content for ${page.name}`;
            }

            structure.children[0].children.push({
                name: strippedName,
                originalName: page.name,
                children: [{ name: 'index.js', content: pageContent }]
            });
        }
    }

    // Serverless APIs
    if (serverlessApis && serverlessApis.length > 0) {
        structure.children.push({
            name: 'api',
            children: []
        });

        addChildren(structure.children[structure.children.length - 1].children, serverlessApis, api => ({
            name: `${api.name || 'unnamed_serverless_api'}.js`,
            content: api.code || ''
        }));
    }

    // Components with instance handling
    const components = new Map();

    if (projectComponents.pages) {
        projectComponents.pages.forEach(page => {
            if (page.components) {
                page.components.forEach(component => {
                    const componentName = component.name || 'unnamed_component';
                    const componentCode = modifyComponentCode(
                        component.code || component.instanceCode,
                        component.position,
                        component.dimensions
                    );
                    
                    if (!components.has(componentName)) {
                        components.set(componentName, componentCode);
                    } else {
                        // If component exists but has different instance code, create a variant
                        const existingCode = components.get(componentName);
                        if (existingCode !== componentCode) {
                            components.set(`${componentName}_${components.size}`, componentCode);
                        }
                    }
                });
            }
        });
    }

    if (components.size > 0) {
        structure.children.push({
            name: 'components',
            children: []
        });

        addChildren(
            structure.children[structure.children.length - 1].children,
            Array.from(components.entries()),
            ([name, code]) => ({
                name: `${name}.js`,
                content: code
            })
        );
    }

    // Add static configuration files
    structure.children.push(
        {
            name: 'package.json',
            content: JSON.stringify({
                name: "nextjs-builder",
                version: "0.1.0",
                private: true,
                scripts: {
                    dev: "next dev",
                    build: "next build",
                    start: "next start",
                    lint: "next lint"
                },
                dependencies: {
                    next: "14.2.5",
                    react: "^18",
                    "react-dom": "^18",
                    "styled-components": "^6.1.12"
                },
                devDependencies: {
                    postcss: "^8",
                    tailwindcss: "^3.4.1"
                }
            }, null, 2)
        },
        {
            name: 'next.config.js',
            content: '/** @type {import("next").NextConfig} */\nconst nextConfig = {};\nmodule.exports = nextConfig;'
        },
        {
            name: 'jsconfig.json',
            content: JSON.stringify(jsconfig, null, 2)
        },
        {
            name: 'globals.css',
            content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;"
        },
        {
            name: 'postcss.config.js',
            content: `/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: {
        tailwindcss: {},
    },
};

export default config;`
        },
        {
            name: 'tailwind.config.js',
            content: `/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};`
        }
    );

    return structure;
};

const useGenerateFolderStructure = (projectData, projectComponents, serverlessApis) => {
    const [folderStructure, setFolderStructure] = useState(null);
    const isGeneratedRef = useRef(false);

    const jsconfig = useMemo(() => ({
        compilerOptions: {
            baseUrl: ".",
            paths: {
                "@components/*": ["components/*"],
                "@pages/*": ["pages/*"]
            }
        }
    }), []);

    const generateStructure = useCallback(async () => {
        if (projectData && projectComponents && jsconfig && !isGeneratedRef.current) {
            try {
                const structure = await generateFolderStructureJson(
                    projectData,
                    projectComponents,
                    jsconfig,
                    serverlessApis
                );
                setFolderStructure(structure);
                isGeneratedRef.current = true;
            } catch (error) {
                console.error('Error generating folder structure:', error);
                setFolderStructure(null);
            }
        }
    }, [projectData, projectComponents, jsconfig, serverlessApis]);

    useEffect(() => {
        generateStructure();
    }, [generateStructure]);

    return folderStructure;
};

export default useGenerateFolderStructure;