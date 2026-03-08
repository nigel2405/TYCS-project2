import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Download pre-configured GPU Agent ZIP
// @route   GET /api/provider/agent/download
// @access  Private (Provider)
export const downloadAgent = async (req, res, next) => {
    try {
        if (req.user.role !== 'provider') {
            return res.status(403).json({
                success: false,
                message: 'Only providers can download the agent',
            });
        }

        const providerId = req.user._id;
        // Use the CLIENT_URL to derive the SERVER_URL or use a dedicated env if preferred
        // For Render deployment, it's safer to use the actual backend URL if known, 
        // or just assume it's the current host.
        const protocol = req.protocol;
        const host = req.get('host');
        const serverUrl = `${protocol}://${host}`;

        const agentDirPath = path.join(__dirname, '../../agent');
        const agentFilePath = path.join(agentDirPath, 'gpu_agent.py');
        const requirementsPath = path.join(agentDirPath, 'requirements.txt');
        const guidePath = path.join(agentDirPath, 'PROVIDER_SETUP_GUIDE.md');

        if (!fs.existsSync(agentFilePath) || !fs.existsSync(requirementsPath)) {
            return res.status(404).json({
                success: false,
                message: 'Agent source files not found on server',
            });
        }

        // Create a ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        res.attachment('gpushare-agent.zip');

        archive.on('error', function (err) {
            throw err;
        });

        // pipe archive data to the response
        archive.pipe(res);

        // append files from a sub-directory
        archive.file(agentFilePath, { name: 'gpu_agent.py' });
        archive.file(requirementsPath, { name: 'requirements.txt' });
        if (fs.existsSync(guidePath)) {
            archive.file(guidePath, { name: 'PROVIDER_SETUP_GUIDE.md' });
        }

        // Create the .env file content
        const envContent = `SERVER_URL=${serverUrl}\nPROVIDER_ID=${providerId}\n`;
        archive.append(envContent, { name: '.env' });

        // finalize the archive
        await archive.finalize();

    } catch (error) {
        console.error('Download Agent Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to generate agent download',
            });
        }
    }
};
