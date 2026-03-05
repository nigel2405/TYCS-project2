import si from 'systeminformation';

export const detectGPU = async () => {
  try {
    const graphics = await si.graphics();

    if (!graphics || !graphics.controllers || graphics.controllers.length === 0) {
      throw new Error('No graphics controllers detected by systeminformation.');
    }

    // Try to find a dedicated GPU first, fallback to the first controller if none found
    let primaryGpu = graphics.controllers.find(ctrl => ctrl.vram > 1024) || graphics.controllers[0];

    // Systeminformation returns VRAM in MB
    let vramGb = 4; // safe default
    if (primaryGpu.vram) {
      vramGb = Math.round(primaryGpu.vram / 1024);
    }

    let manufacturer = 'Other';
    const vendorName = (primaryGpu.vendor || primaryGpu.model || '').toLowerCase();

    if (vendorName.includes('nvidia')) manufacturer = 'NVIDIA';
    else if (vendorName.includes('amd') || vendorName.includes('radeon')) manufacturer = 'AMD';
    else if (vendorName.includes('intel')) manufacturer = 'Intel';

    return {
      name: primaryGpu.model || 'Generic GPU',
      manufacturer: manufacturer,
      model: primaryGpu.model || 'Unknown Model',
      vram: vramGb > 0 ? vramGb : 4,
      clockSpeed: primaryGpu.clockCore || 1500, // May not be available on all systems
      cudaCores: 0,
      memoryType: 'Unknown',
      memoryBandwidth: 0,
      powerConsumption: 0,
      ports: graphics.displays ? graphics.displays.map(d => d.connection || 'Unknown Port').filter(Boolean) : [],
    };

  } catch (error) {
    console.error('Fatal error in GPU detection using systeminformation:', error);
    // Ultimate fallback if the library fails or OS blocks access
    return {
      name: 'Generic GPU',
      manufacturer: 'Unknown',
      model: 'Unknown Model',
      vram: 8,
      clockSpeed: 0,
      cudaCores: 0,
      memoryType: 'Unknown',
      memoryBandwidth: 0,
      powerConsumption: 0,
      ports: [],
    };
  }
};
