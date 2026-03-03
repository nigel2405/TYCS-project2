import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export const detectGPU = async () => {
  try {
    // Attempt to use system commands to get real GPU data
    let name = 'Unknown System GPU';
    let vram = 8; // Default fallback in GB
    let manufacturer = 'Unknown';

    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic path win32_VideoController get name,AdapterRAM /value');
        const nameMatch = stdout.match(/Name=(.*)/i);
        const ramMatch = stdout.match(/AdapterRAM=(\d+)/i);

        if (nameMatch && nameMatch[1]) name = nameMatch[1].trim();
        if (ramMatch && ramMatch[1]) vram = Math.round(parseInt(ramMatch[1], 10) / (1024 * 1024 * 1024)); // Bytes -> GB
      } else {
        // Linux / macOS fallback using generic lspci or nvidia-smi
        const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader');
        const parts = stdout.split(',');
        if (parts.length >= 2) {
          name = parts[0].trim();
          vram = Math.round(parseInt(parts[1].replace(/[^0-9]/g, ''), 10) / 1024); // MB -> GB
        }
      }
    } catch (cmdErr) {
      console.warn('System GPU scan commands failed, falling back to generic placeholder.');
    }

    if (name.toLowerCase().includes('nvidia')) manufacturer = 'NVIDIA';
    else if (name.toLowerCase().includes('amd') || name.toLowerCase().includes('radeon')) manufacturer = 'AMD';
    else if (name.toLowerCase().includes('intel')) manufacturer = 'Intel';
    else manufacturer = 'Other';

    return {
      name: name,
      manufacturer: manufacturer,
      model: name,
      vram: vram || 4, // Final fallback to 4GB if parsing failed
      clockSpeed: 1500, // Hard to reliably extract via simple commands without admin privileges
      cudaCores: 0,
      memoryType: 'Unknown',
      memoryBandwidth: 0,
      powerConsumption: 0,
      ports: ['HDMI', 'DisplayPort'],
    };

  } catch (error) {
    console.error('Fatal error in GPU detection:', error);
    // Generic ultimate fallback
    return {
      name: 'Generic GPU',
      manufacturer: 'Unknown',
      model: 'Unknown Model',
      vram: 8,
      clockSpeed: 0,
      cudaCores: 0,
      pricePerHour: 1.0,
      memoryType: 'Unknown',
      memoryBandwidth: 0,
      powerConsumption: 0,
      ports: [],
    };
  }
};
