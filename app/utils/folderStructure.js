import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { generateNormalReactPage } from '../utils/api'; // Import the generateNormalReactPage function

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

    // Function to modify the component code
    function modifyComponentCode(code) {
        const reactImport = `import React from 'react';\n`;
        const styledImport = `import styled from 'styled-components';\n`;

        // Insert import statements at the beginning
        let modifiedCode = `${reactImport}${styledImport}${code}`;

        // Add 'export default' to the start of the function definition
        modifiedCode = modifiedCode.replace(/function\s+(\w+)/, 'export default function $1');

        return modifiedCode;
    }

    // Pages
    if (projectData.pages) {
        structure.children.push({
            name: 'pages',
            children: []
        });

        // Generate the content for each page using generateNormalReactPage
        for (const page of projectData.pages) {
            const strippedName = (page.name || 'unnamed_page').replace(/\s+/g, '');
            let pageContent = '';

            try {
                const prompt = `Generate a Next.js page for ${page.name}. Include the following components: ${page.components?.join(', ') || 'none'}. 
                Here is the jsconfig.json file for reference: ${JSON.stringify(jsconfig)}.`;
                pageContent = await generateNormalReactPage(prompt); // Fetch page content

                // Ensuring that the code block returned by the AI is valid and without comments
                pageContent = pageContent.replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, '').trim());
            } catch (error) {
                console.error(`Error generating page content for ${page.name}:`, error);
                pageContent = `// Error generating page content for ${page.name}`;
            }

            structure.children[0].children.push({
                name: strippedName,
                originalName: page.name || 'unnamed_page',  // Keeping a reference to the original page name
                children: [{ name: strippedName, content: pageContent || '' }]
            });
        }
    }

    // APIs
    // if (projectData.apis) {
    //     structure.children.push({
    //         name: 'api',
    //         children: []
    //     });
    //     addChildren(structure.children[structure.children.length - 1].children, projectData.apis, api => ({
    //         name: `${api.name || 'unnamed_api'}.js`,
    //         content: api.content || '',
    //     }));
    // }

    // Serverless APIs (newly added section)
    if (serverlessApis && serverlessApis.length > 0) {
        structure.children.push({
            name: 'api', // Serverless APIs usually reside in the `/api` folder in Next.js
            children: []
        });

        addChildren(structure.children[structure.children.length - 1].children, serverlessApis, api => ({
            name: `${api.name || 'unnamed_serverless_api'}.js`,
            content: api.code || '', // Use the code from serverlessApis
        }));
    }

    // Components
    const components = new Map(); // Use a Map to ensure unique components by name

    if (projectComponents.pages) {
        projectComponents.pages.forEach(page => {
            if (page.components) {
                page.components.forEach(component => {
                    // Use the component name as the key to ensure uniqueness
                    const componentName = component.name || 'unnamed_component';
                    if (!components.has(componentName)) {
                        // Modify the component code as per your requirements
                        const modifiedCode = modifyComponentCode(component.code);
                        components.set(componentName, {
                            ...component,
                            code: modifiedCode
                        });
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

        addChildren(structure.children[structure.children.length - 1].children, Array.from(components.values()), component => ({
            name: `${component.name || 'unnamed_component'}.js`,
            content: component.code || '',
        }));
    }

    // Middleware
    if (projectData.middleware) {
        structure.children.push({
            name: 'middleware',
            children: []
        });
        addChildren(structure.children[structure.children.length - 1].children, projectData.middleware, middleware => ({
            name: `${middleware.name || 'unnamed_middleware'}.js`,
            content: middleware.code || '',
        }));
    }

    // Add other static folders/files
    structure.children.push(
        {
            name: 'package.json',
            content: JSON.stringify({
                "name": "nextjs-builder",
                "version": "0.1.0",
                "private": true,
                "scripts": {
                    "dev": "next dev",
                    "build": "next build",
                    "start": "next start",
                    "lint": "next lint"
                },
                "dependencies": {
                    "next": "14.2.5",
                    "react": "^18",
                    "react-dom": "^18",
                    "styled-components": "^6.1.12"
                },
                "devDependencies": {
                  "postcss": "^8",
                  "tailwindcss": "^3.4.1"
                }
            })
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
            "gradient-conic":
              "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
          },
        },
      },
      plugins: [],
    };`
        }
    );

    /* styles/globals.css */

    return structure;
};

const useGenerateFolderStructure = (projectData, projectComponents, serverlessApis) => {
    const [folderStructure, setFolderStructure] = useState(null);
    const isGeneratedRef = useRef(false); // Use ref to avoid unnecessary re-renders

    const jsconfig = useMemo(() => ({
        compilerOptions: {
            baseUrl: ".",
            paths: {
                "@components/*": ["components/*"],
                "@pages/*": ["pages/*"]
            }
        }
    }), []); // Memoize to avoid unnecessary recalculations

    const generateStructure = useCallback(async () => {
        if (projectData && projectComponents && jsconfig && !isGeneratedRef.current) {
            try {
                const structure = await generateFolderStructureJson(projectData, projectComponents, jsconfig, serverlessApis);
                setFolderStructure(structure);
                isGeneratedRef.current = true; // Mark as generated
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
