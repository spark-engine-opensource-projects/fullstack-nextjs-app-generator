import { useEffect, useState, useMemo } from 'react';
import { generateNormalReactPage } from './api'; // Import the generateNormalReactPage function

/**
 * Helper function to convert numeric values to 'vw' units.
 * Caps the value at '100vw' to prevent overflow.
 * @param {number} value - The pixel value to convert.
 * @param {number} baseWidth - The base width for conversion (default: 1920).
 * @returns {string} - The converted value in 'vw'.
 */
const toVW = (value, baseWidth = 1920) => {
  const vwValue = (value / baseWidth) * 100;
  return `${Math.min(vwValue, 100)}vw`;
};

const generateFolderStructureJson = async (
  projectData,
  projectComponents,
  jsconfig,
  serverlessApis,
  droppedComponents,
  dropAreaHeight 
) => {
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
    // Remove existing React and styled-components imports to avoid duplication
    let modifiedCode = code.replace(
      /import\s+React\s+from\s+['"]react['"];?/g,
      ''
    ).replace(
      /import\s+styled\s+from\s+['"]styled-components['"];?/g,
      ''
    );

    // Add necessary imports at the top
    const reactImport = `import React from 'react';\n`;
    const styledImport = `import styled from 'styled-components';\n`;
    modifiedCode = `${reactImport}${styledImport}${modifiedCode}`;

    // Ensure there is a default export
    if (!/export\s+default/.test(modifiedCode)) {
      const exportRegex = /function\s+(\w+)/;
      const match = modifiedCode.match(exportRegex);
      if (match && match[1]) {
        modifiedCode = modifiedCode.replace(
          exportRegex,
          'export default function ' + match[1]
        );
      } else {
        // For components defined as constants or arrow functions
        const arrowFunctionMatch = modifiedCode.match(/const\s+(\w+)\s*=\s*(\(.*?\)\s*=>|\w+\s*=>)/);
        if (arrowFunctionMatch && arrowFunctionMatch[1]) {
          modifiedCode += `\n\nexport default ${arrowFunctionMatch[1]};`;
        } else {
          // If unable to find a named function, export the component as is
          modifiedCode += '\n\nexport default Component;';
        }
      }
    }

    return modifiedCode;
  }

  // Pages
  if (projectData.pages) {
    structure.children.push({
      name: 'pages',
      children: [],
    });

    const pagesDirectory = structure.children[structure.children.length - 1].children;

    // Generate the content for each page
    for (let i = 0; i < projectData.pages.length; i++) {
      const page = projectData.pages[i];
      const strippedName = (page.name || 'unnamed_page').replace(/\s+/g, '');
      let pageContent = '';

      try {
        // Get the components for this page from droppedComponents
        const pageComponents = droppedComponents[page.name] || [];

        if (pageComponents.length > 0) {
          // Generate import statements
          const componentImports = pageComponents
            .map(
              (component) =>
                `import ${component.name} from '../components/${component.name}';`
            )
            .join('\n');

          // Generate JSX code for components with 'vw' units
          const componentJSX = pageComponents
            .map((component) => {
              const { position, dimensions } = component;
              const { x, y } = position;
              let { width, height } = dimensions;

              // Convert pixel values to 'vw' using the helper function
              const left = toVW(x * 1.36);
              const adjustedWidth = toVW(width * 1.36); // Adjust width as per your logic

              return `
                <div style={{
                  position: 'absolute',
                  left: '${left}',
                  top: ${y},
                  width: '${adjustedWidth}',
                  height: ${height}
                }}>
                  <${component.name} />
                </div>
              `;
            })
            .join('\n');

          // Build the page content using JSX syntax
          pageContent = `
            import React from 'react';
            ${componentImports}

            export default function ${strippedName}() {
              return (
                <div style={{ position: 'relative', width: '98vw', height: ${dropAreaHeight} }}>
                  ${componentJSX}
                </div>
              );
            }
          `;
        } else {
          // If no components, create an empty page
          pageContent = `
            import React from 'react';

            export default function ${strippedName}() {
              return (
                <div>
                  <p>This page has no components.</p>
                </div>
              );
            }
          `;
        }
      } catch (error) {
        console.error(`Error generating page content for ${page.name}:`, error);
        pageContent = `// Error generating page content for ${page.name}`;
      }

      // Determine the file name
      let fileName;
      if (i === 0) {
        // First page becomes index.js
        fileName = 'index.js';
      } else {
        fileName = `${strippedName}.js`;
      }

      pagesDirectory.push({
        name: fileName,
        originalName: page.name || 'unnamed_page',
        content: pageContent || '',
      });
    }

    // **Add the _document.js file to the pages directory**
    pagesDirectory.push({
      name: '_document.js',
      content: `import Document from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          // Enhance the App component to collect styles
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        // Combine initial styles with the collected styles
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }
}`
    });
  }

  // Serverless APIs (unchanged)
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

  // Components (unchanged)
  const components = new Map(); // Use a Map to ensure unique components by name

  // Collect components from droppedComponents
  for (const pageName in droppedComponents) {
    const pageComponents = droppedComponents[pageName];
    pageComponents.forEach((component) => {
      const componentName = component.name || 'unnamed_component';
      if (!components.has(componentName)) {
        // Modify the component code as per your requirements
        const modifiedCode = modifyComponentCode(component.code);
        components.set(componentName, {
          ...component,
          code: modifiedCode,
        });
      }
    });
  }

  if (components.size > 0) {
    structure.children.push({
      name: 'components',
      children: [],
    });

    addChildren(
      structure.children[structure.children.length - 1].children,
      Array.from(components.values()),
      (component) => ({
        name: `${component.name || 'unnamed_component'}.js`,
        content: component.code || '',
      })
    );
  }

  // Middleware (unchanged)
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

  // Add other static folders/files (unchanged)
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
      }, null, 2)
    },
    {
      name: 'next.config.js',
      content: `/** @type {import("next").NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
`
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

module.exports = config;` // Changed export syntax to CommonJS
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

const useGenerateFolderStructure = (
  projectData,
  projectComponents,
  serverlessApis,
  droppedComponents,
  dropAreaHeight 
) => {
  const [folderStructure, setFolderStructure] = useState(null);

  const jsconfig = useMemo(
    () => ({
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@components/*': ['components/*'],
          '@pages/*': ['pages/*'],
        },
      },
    }),
    []
  );

  useEffect(() => {
    const generateStructure = async () => {
      try {
        const structure = await generateFolderStructureJson(
          projectData,
          projectComponents,
          jsconfig,
          serverlessApis,
          droppedComponents,
          dropAreaHeight 
        );
        setFolderStructure(structure);
      } catch (error) {
        console.error('Error generating folder structure:', error);
      }
    };

    generateStructure();
  }, [projectData, projectComponents, serverlessApis, droppedComponents, jsconfig]);

  return folderStructure;
};

export default useGenerateFolderStructure;
