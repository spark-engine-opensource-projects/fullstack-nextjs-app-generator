import React, { useState, useEffect } from 'react';
import { FaFolder, FaFolderOpen, FaFile } from 'react-icons/fa';
import { MdCircle } from 'react-icons/md';
import { generateNormalReactPage, generateSQLDatabaseQuery, generateServerlessApi } from '../utils/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';

const extractEnvVariables = (code) => {
    const regex = /process\.env\.([A-Z_]+)|const\s*{\s*([^}]+)\s*}\s*=\s*process\.env/g;
    const matches = new Set();
    let match;

    while ((match = regex.exec(code)) !== null) {
        // Match for process.env.VAR_NAME
        if (match[1]) {
            matches.add(match[1]);
        }
        
        // Match for destructuring: const { var1, var2 } = process.env
        if (match[2]) {
            const vars = match[2].split(',').map(variable => variable.trim());
            vars.forEach(variable => matches.add(variable));
        }
    }

    return Array.from(matches);
};

const ProjectFolderStructure = ({ structure, projectData, sqlCode }) => {
    const [openNodes, setOpenNodes] = useState({});
    const [visibleCode, setVisibleCode] = useState({});
    const [deploying, setDeploying] = useState(false);
    const [deployError, setDeployError] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [requiredEnvVars, setRequiredEnvVars] = useState([]);
    const [envVariables, setEnvVariables] = useState({});
    const [keys, setKeys] = useState({
        SUPABASE_DB_URL: '',
        VERCEL_TOKEN: ''
    });

    useEffect(() => {
        const extractRequiredEnvVars = () => {
            const allEnvVars = new Set();

            const traverseStructure = (node) => {
                if (node.content) {
                    const envVars = extractEnvVariables(node.content);
                    envVars.forEach((envVar) => allEnvVars.add(envVar));
                }

                if (node.children && node.children.length > 0) {
                    node.children.forEach(traverseStructure);
                }
            };

            traverseStructure(structure);
            setRequiredEnvVars(Array.from(allEnvVars));
        };

        extractRequiredEnvVars();
    }, [structure]);

    const toggleOpen = (nodeName) => {
        setOpenNodes((prev) => ({
            ...prev,
            [nodeName]: !prev[nodeName],
        }));
    };

    const toggleCodeVisibility = (nodeName) => {
        setVisibleCode((prev) => ({
            ...prev,
            [nodeName]: !prev[nodeName],
        }));
    };

    const regeneratePageContent = async (node, path) => {
        try {
            let newContent;
            const jsconfigFile = structure.children.find((child) => child.name === 'jsconfig.json');
            const jsconfig = jsconfigFile ? JSON.parse(jsconfigFile.content) : {};

            if (path.includes('/api')) {
                const prompt = `Generate a Vercel serverless API for ${node.name}. Here is the jsconfig.json file for reference: ${JSON.stringify(jsconfig)}.`;
                newContent = await generateServerlessApi(prompt);
            } else {
                const pageComponents = node.components?.join(', ') || 'none';
                const prompt = `Generate a Next.js page for ${node.name}. Include the following components: ${pageComponents}. Here is the jsconfig.json file for reference: ${JSON.stringify(jsconfig)}.`;
                newContent = await generateNormalReactPage(prompt);
            }

            node.content = newContent;
            toggleCodeVisibility(`${path}/${node.name}`);
        } catch (error) {
            console.error(`Error regenerating content for ${node.name}:`, error);
            node.content = '// Error regenerating content';
        }
    };

    const allChildrenHaveContent = (children) => {
        return children.every((child) => {
            if (child.children && child.children.length > 0) {
                return allChildrenHaveContent(child.children);
            }
            return child.content && typeof child.content === 'string' && child.content.trim().length > 0;
        });
    };

    const renderStructure = (node, path = '') => {
        if (!node) return null;

        const nodePath = `${path}/${node.name}`;
        const isOpen = openNodes[nodePath];
        const hasChildren = node.children && node.children.length > 0;
        const isContentFilled = typeof node.content === 'string' && node.content.trim().length > 0;
        const isCodeVisible = visibleCode[nodePath];

        const folderIsGreen = hasChildren && allChildrenHaveContent(node.children);

        return (
            <ul style={{ listStyleType: 'none', paddingLeft: '20px' }}>
                <li>
                    <div
                        style={{ display: 'flex', alignItems: 'center', cursor: hasChildren ? 'pointer' : 'default' }}
                        onClick={() => hasChildren && toggleOpen(nodePath)}
                    >
                        {hasChildren ? (
                            isOpen ? (
                                <FaFolderOpen
                                    style={{ marginRight: '8px', color: folderIsGreen ? 'green' : 'inherit' }}
                                />
                            ) : (
                                <FaFolder style={{ marginRight: '8px', color: folderIsGreen ? 'green' : 'inherit' }} />
                            )
                        ) : (
                            <FaFile style={{ marginRight: '8px' }} />
                        )}
                        {node.name}
                        <MdCircle
                            style={{ marginLeft: '8px', color: isContentFilled || folderIsGreen ? 'green' : 'red' }}
                            size={12}
                        />

                        {!hasChildren && (
                            <button
                                style={{ marginLeft: '8px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    regeneratePageContent(node, path);
                                }}
                                className="btn py-1 px-2 bg-red-500 text-white rounded"
                            >
                                Regenerate
                            </button>
                        )}

                        {!hasChildren && isContentFilled && (
                            <button
                                style={{ marginLeft: '8px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCodeVisibility(nodePath);
                                }}
                                className="btn py-1 px-2 bg-blue-500 text-white rounded"
                            >
                                {isCodeVisible ? 'Hide Code' : 'Show Code'}
                            </button>
                        )}
                    </div>
                    {isOpen && hasChildren && (
                        <div style={{ marginLeft: '20px' }}>
                            {node.children.map((child, index) => (
                                <div key={index}>{renderStructure(child, nodePath)}</div>
                            ))}
                        </div>
                    )}
                    {isCodeVisible && node.content && (
                        <pre
                            style={{
                                marginLeft: '20px',
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '5px',
                            }}
                        >
                            {node.content}
                        </pre>
                    )}
                </li>
            </ul>
        );
    };

    const handleDeploy = async () => {
        setDeploying(true);
        setDeployError(null);

        try {
            const collectedData = await collectProjectData(structure);

            const response = await axios.post(`${process.env.NGROK_DEPLOYER_URL}/deploy`, {
                structure: collectedData,
            });

            if (response.status === 200) {
                console.log('Deployment started successfully');
            } else {
                setDeployError('Deployment failed. Please check the logs for more details.');
            }
        } catch (error) {
            console.error('Deployment failed:', error);
            setDeployError('Deployment failed. Please try again.');
        } finally {
            setDeploying(false);
        }
    };

    const collectProjectData = async (structure) => {
        const collectedData = {
            files: [],
            packageJson: '',
            jsConfigCode: '',
            nextConfigJs: '',
            postcssConfig: '',
            tailwindConfig: '',
            globalsCss: '',
            envVariables: [],
            sqlCode: '',
            keys: {},
            projectName: '',
        };

        const traverseStructure = (node, parentPath = '') => {
            const nodePath = `${parentPath}/${node.name}`;

            if (node.children && node.children.length > 0) {
                node.children.forEach((child) => traverseStructure(child, nodePath));
            } else if (node.content) {
                const fileInfo = {
                    fileName: node.name,
                    content: node.content,
                };

                if (parentPath.includes('/api')) {
                    collectedData.files.push({ ...fileInfo, type: 'api' });
                } else if (parentPath.includes('/pages')) {
                    collectedData.files.push({ ...fileInfo, type: 'page' });
                } else if (parentPath.includes('/middleware')) {
                    collectedData.files.push({ ...fileInfo, type: 'middleware' });
                } else if (parentPath.includes('/components')) {
                    collectedData.files.push({ ...fileInfo, type: 'component' });
                } else if (node.name === 'package.json') {
                    collectedData.packageJson = node.content;
                } else if (node.name === 'jsconfig.json') {
                    collectedData.jsConfigCode = node.content;
                } else if (node.name === 'next.config.js') {
                    collectedData.nextConfigJs = node.content;
                } else if (node.name === 'postcss.config.js') {
                    collectedData.postcssConfig = node.content;
                } else if (node.name === 'tailwind.config.js') {
                    collectedData.tailwindConfig = node.content;
                } else if (node.name === 'globals.css') {
                    collectedData.globalsCss = node.content;
                }
            }
        };

        traverseStructure(structure);

        collectedData.envVariables = requiredEnvVars.map((key) => ({
            key,
            type: 'plain',
            value: envVariables[key] || '',
            target: ['production', 'preview', 'development'],
        }));

        collectedData.sqlCode = sqlCode;

        collectedData.keys = {
            SUPABASE_DB_URL: keys.SUPABASE_DB_URL || '',
            VERCEL_TOKEN: keys.VERCEL_TOKEN || '',
        };

        collectedData.projectName = projectName;

        return JSON.stringify(collectedData);
    };

    const generateZipFile = (structure) => {
        const zip = new JSZip();

        const traverseStructure = (node, parentPath = '') => {
            const nodePath = `${parentPath}/${node.name}`;

            if (node.children && node.children.length > 0) {
                node.children.forEach((child) => traverseStructure(child, nodePath));
            } else if (node.content) {
                // Check if the file is inside the 'pages' folder and name it 'index.js'
                if (parentPath.includes('/pages') && !node.name.includes('.')) {
                    // This condition assumes that node.name without an extension is a folder (i.e., a page directory)
                    zip.file(`${parentPath}/index.js`, node.content);
                } else {
                    zip.file(nodePath.startsWith('/') ? nodePath.slice(1) : nodePath, node.content);
                }
            }
        };

        traverseStructure(structure);
        return zip;
    };

    const handleDownload = async () => {
        const zip = generateZipFile(structure);

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${projectName || 'project'}.zip`);
    };

    const handleEnvVarChange = (key, value) => {
        setEnvVariables((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleKeyChange = (key, value) => {
        setKeys((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <div className="folder-structure">
            <h3>Project Folder Structure</h3>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px' }}>Vercel Project Name:</label>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="border rounded px-2 py-1"
                    placeholder="Enter project name"
                />
            </div>

            {requiredEnvVars.map((key) => (
                <div key={key} style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px' }}>{key}:</label>
                    <input
                        type="text"
                        value={envVariables[key] || ''}
                        onChange={(e) => handleEnvVarChange(key, e.target.value)}
                        className="border rounded px-2 py-1"
                        placeholder={`Enter value for ${key}`}
                    />
                </div>
            ))}

            <div style={{ marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>SUPABASE_DB_URL:</label>
                <input
                    type="text"
                    value={keys.SUPABASE_DB_URL}
                    onChange={(e) => handleKeyChange('SUPABASE_DB_URL', e.target.value)}
                    className="border rounded px-2 py-1"
                    placeholder="Enter SUPABASE_DB_URL"
                />
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>VERCEL_TOKEN:</label>
                <input
                    type="text"
                    value={keys.VERCEL_TOKEN}
                    onChange={(e) => handleKeyChange('VERCEL_TOKEN', e.target.value)}
                    className="border rounded px-2 py-1"
                    placeholder="Enter VERCEL_TOKEN"
                />
            </div>

            {renderStructure(structure)}

            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={handleDeploy}
                    className={`btn py-2 px-4 ${deploying ? 'bg-gray-500' : 'bg-green-500'} text-white rounded`}
                    disabled={
                        deploying ||
                        requiredEnvVars.some((key) => !envVariables[key]) ||
                        !keys.SUPABASE_DB_URL ||
                        !keys.VERCEL_TOKEN
                    }
                >
                    {deploying ? 'Deploying...' : 'Deploy Project'}
                </button>
                {deployError && <p style={{ color: 'red', marginTop: '10px' }}>{deployError}</p>}

                <button
                    onClick={handleDownload}
                    className="btn py-2 px-4 bg-blue-500 text-white rounded ml-4"
                >
                    Download Project
                </button>
            </div>
        </div>
    );
};

export default ProjectFolderStructure;
